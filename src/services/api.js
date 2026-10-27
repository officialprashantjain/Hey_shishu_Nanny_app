import axios from 'axios';
import { getSession, saveSession, removeToken } from '../utils/storage';

const AUTH_PATH = '/auth/nanny';
const settings = { baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, timeout: 30000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' } };
const instance = axios.create(settings);
const refreshClient = axios.create({ ...settings, timeout: 15000 });
let refreshPromise;
const publicAuth = (url = '') => /\/auth\/(parent|nanny)\/(login|register|send-otp|verify-otp|verify-2fa|complete-registration|forgot-password|reset-password|refresh)(?:$|\?)/.test(url);

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const session = await getSession();
      if (!session?.refreshToken) return null;
      try {
        const { data } = await refreshClient.post(`${AUTH_PATH}/refresh`, { refreshToken: session.refreshToken });
        const current = await getSession();
        // A logout or a different login may have completed while this request was in flight.
        if (current?.refreshToken !== session.refreshToken) return current?.token || null;
        await saveSession({ ...current, ...data, user: { ...current.user, ...data.data }, data: undefined, status: undefined });
        return data.token;
      } catch (error) {
        if ([400, 401, 403].includes(error.response?.status)) {
          const current = await getSession();
          if (current?.refreshToken === session.refreshToken) await removeToken();
        }
        // Offline, timeout and server errors keep the saved session for the next retry.
        throw error;
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

instance.interceptors.request.use(async (config) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.info(`[API] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url?.split('?')[0] || ''}`);
  }
  if (!publicAuth(config.url)) {
    const session = await getSession();
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});
instance.interceptors.response.use(async (response) => {
  const body = response.data;
  if (response.config.url?.startsWith(AUTH_PATH) && body?.token && body?.refreshToken) {
    await saveSession({ token: body.token, refreshToken: body.refreshToken,
      refreshExpiresAt: body.refreshExpiresAt, user: body.data || (await getSession())?.user });
  }
  return response;
}, async (error) => {
  const config = error.config;
  if (error.response?.status !== 401 || !config || config._retry || publicAuth(config.url)) throw error;
  config._retry = true;
  const session = await getSession();
  if (!session) throw error;
  if (config.headers.Authorization !== `Bearer ${session.token}`) return instance(config);
  if (!session.refreshToken) {
    await removeToken();
    throw error;
  }
  const token = await refreshAccessToken();
  if (!token) throw error;
  return instance(config);
});

function accessTokenIsFresh(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(globalThis.atob(payload));
    return decoded.exp * 1000 > Date.now() + 30000;
  } catch (_) { return false; }
}

export async function restoreSession() {
  let session = await getSession();
  if (!session?.token) return null;
  if (session.refreshToken) {
    if (accessTokenIsFresh(session.token)) return session;
    try { await refreshAccessToken(); } catch (error) {
      console.warn('[Session] Restore deferred:', error.response?.status || error.code || 'network');
    }
    return getSession();
  }
  // Legacy 7-day tokens remain usable until they expire; new logins receive refresh tokens.
  try {
    const response = await instance.get('/nanny/profile');
    const data = response.data?.data;
    session = { ...session, user: data?.customer || data?.profile?.traineeApplicationId || session.user };
    await saveSession(session);
  } catch (error) {
    console.warn('[Session] Legacy validation:', error.response?.status || error.code || 'network');
  }
  return getSession();
}

export async function logoutSession() {
  const session = await getSession();
  // Explicit logout must survive an immediate process kill, even when offline.
  await removeToken();
  if (!session?.token) return;
  const revoke = (token) => refreshClient.post(`${AUTH_PATH}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
  try { await revoke(session.token); }
  catch (error) {
    try {
      if (error.response?.status !== 401 || !session.refreshToken) throw error;
      const response = await refreshClient.post(`${AUTH_PATH}/refresh`, { refreshToken: session.refreshToken });
      // Revoke using the temporary access token; never put the logged-out session back in storage.
      await revoke(response.data.token);
    } catch (failure) {
      console.warn('[Session] Logout server unavailable:', failure.response?.status || failure.code || 'network');
    }
  }
}
const body = (response) => response.data;
export default {
  get: (url, config) => instance.get(url, config).then(body),
  post: (url, data, config) => instance.post(url, data, config).then(body),
  put: (url, data, config) => instance.put(url, data, config).then(body),
  patch: (url, data, config) => instance.patch(url, data, config).then(body),
  delete: (url, config) => instance.delete(url, config).then(body),
};
