import axios from "axios";
import { router } from "expo-router";
import { getToken, removeToken } from "../utils/storage";
import { Alert } from "react-native";

const instance = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_BASE_URL}`,
  timeout: 50000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: Attach JWT ────────────────────────────────────────
instance.interceptors.request.use(
  async function (config) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `[API ▶] ${config.method?.toUpperCase()} ${config.url} | Auth: ${token ? "YES" : "NONE"}`,
    );
    return config;
  },
  (error) => {
    console.error(`[API REQUEST ERROR]`, error);
    return Promise.reject(error);
  },
);

// ─── Response Interceptor: Handle Errors ────────────────────────────────────
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config;
    const responseData = error?.response?.data;
    const errorMsg = responseData?.error || responseData?.message || "";

    console.warn(`[API ❌] ${status} ${config?.url} →`, responseData);

    // ── Retry once on "User not found" (potential DB propagation lag after upsert) ──
    if (
      status === 401 &&
      errorMsg.toLowerCase().includes("user not found") &&
      config &&
      !config._retry
    ) {
      config._retry = true;
      console.log(`[API 🔄 RETRY] Waiting 2s then retrying ${config.url} ...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Re-read token fresh from storage (not in-memory cache)
      const freshToken = await getToken();
      console.log(
        `[API 🔄 RETRY] Using token: ${freshToken ? "EXISTS" : "MISSING"}`,
      );
      if (freshToken) {
        config.headers.Authorization = `Bearer ${freshToken}`;
      }
      return instance(config);
    }

    // ── Terminal 401: clear session and redirect ─────────────────────────────
    if (status === 401) {
      console.error(
        `[API  SESSION EXPIRED] Reason: "${errorMsg}". Clearing and redirecting.`,
      );
      try {
        await removeToken();
      } catch (e) {
        console.warn("Could not remove token:", e);
      }
      Alert.alert(
        "Session Expired",
        `Please log in again.\n(Reason: ${errorMsg || "Unauthorized"})`,
        [{ text: "OK", onPress: () => router.replace("/(onboarding)/splash") }],
      );
    }

    return Promise.reject(error);
  },
);

// ─── Exported API methods ────────────────────────────────────────────────────
const responseBody = (response) => response.data;

const api = {
  get: (url, config) => instance.get(url, config).then(responseBody),
  post: (url, body, config) =>
    instance.post(url, body, config).then(responseBody),
  put: (url, body, config) =>
    instance.put(url, body, config).then(responseBody),
  patch: (url, body, config) =>
    instance.patch(url, body, config).then(responseBody),
  delete: (url, config) => instance.delete(url, config).then(responseBody),
};

export default api;
