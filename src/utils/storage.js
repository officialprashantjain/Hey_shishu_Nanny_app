import * as SecureStore from 'expo-secure-store';

const KEY = 'authSession.v1';
// Accessible after the first device unlock so notification actions can authenticate.
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
let cached;
let writes = Promise.resolve();
const listeners = new Set();
export const subscribeSession = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const notify = (session) => listeners.forEach((listener) => listener(session));

export async function getSession() {
  await writes;
  if (cached !== undefined) return cached;
  const raw = await SecureStore.getItemAsync(KEY, OPTIONS);
  if (raw) {
    cached = JSON.parse(raw);
  } else {
    // Upgrade existing installations without asking for another login.
    const token = await SecureStore.getItemAsync('authToken');
    cached = token ? { token, refreshToken: null, user: null } : null;
  }
  return cached;
}

export function saveSession(session) {
  if (!session?.token || typeof session.token !== 'string') return Promise.reject(new Error('Invalid session token'));
  const next = { ...session, token: session.token.trim() };
  const operation = writes.then(async () => {
    // Persist first: a successful login must survive process termination.
    await SecureStore.setItemAsync(KEY, JSON.stringify(next), OPTIONS);
    cached = next;
    await SecureStore.deleteItemAsync('authToken');
    notify(next);
    return next;
  });
  writes = operation.catch(() => {});
  return operation;
}
export const getToken = async () => (await getSession())?.token || null;
export const saveToken = async (token) => saveSession({ ...(await getSession()), token });
export function removeToken() {
  const operation = writes.then(async () => {
    await SecureStore.deleteItemAsync(KEY, OPTIONS);
    await SecureStore.deleteItemAsync('authToken');
    cached = null;
    notify(null);
  });
  writes = operation.catch(() => {});
  return operation;
}
