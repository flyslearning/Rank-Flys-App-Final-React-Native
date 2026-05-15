import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/auth.store";

export const AUTH_BASE_URL = process.env.EXPO_PUBLIC_AUTH_API;
export const TEST_BASE_URL = process.env.EXPO_PUBLIC_TEST_API;
export const EBOOK_BASE_URL = process.env.EXPO_PUBLIC_EBOOK_API;
export const PAYMENT_BASE_URL = process.env.EXPO_PUBLIC_PAYMENT_API;
export const TOOL_BASE_URL = process.env.EXPO_PUBLIC_TOOL_API;
export const MENTORSHIP_BASE_URL = process.env.EXPO_PUBLIC_MENTORSHIP_API;


export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set<T>(key: string, value: T) {
    if (typeof value === "string") {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  },

  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },

  async clear() {
  console.warn("storage.clear() disabled to protect intro_seen");
  },
  };

export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
export const toolClient = axios.create({
  baseURL: TOOL_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
export const mentorshipClient = axios.create({
  baseURL: MENTORSHIP_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const testClient = axios.create({
  baseURL: TEST_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ebookClient = axios.create({
  baseURL: EBOOK_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
export const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Important: refresh ke liye raw client
const refreshClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});


let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const refreshTokenAndRetry = async (error: AxiosError) => {
  const originalRequest: any = error.config;

  if (!originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        },
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      await logout();
      return Promise.reject(error);
    }

    const response = await refreshClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const newAccessToken =
      response.data.access_token || response.data.accessToken;

    const newRefreshToken =
      response.data.refresh_token || response.data.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      await logout();
      return Promise.reject(error);
    }

    await setTokens(newAccessToken, newRefreshToken);

    
    authClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    testClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    ebookClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    paymentClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    toolClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    mentorshipClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

    processQueue(null, newAccessToken);

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    return axios(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    useAuthStore.getState().logout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};
export const setAuthToken = async (
  accessToken: string,
  refreshToken?: string
) => {
  if (refreshToken) {
    await useAuthStore.getState().setTokens(
      accessToken,
      refreshToken
    );
  }

  authClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

  testClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

  ebookClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

  paymentClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

  toolClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

  mentorshipClient.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;
};


const attachRefreshInterceptor = (client: any) => {
  client.interceptors.response.use(
    (response: any) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        return refreshTokenAndRetry(error);
      }

      return Promise.reject(error);
    }
  );
};

authClient.interceptors.request.use(attachToken);
testClient.interceptors.request.use(attachToken);
ebookClient.interceptors.request.use(attachToken);
paymentClient.interceptors.request.use(attachToken);
toolClient.interceptors.request.use(attachToken);
mentorshipClient.interceptors.request.use(attachToken);


attachRefreshInterceptor(authClient);
attachRefreshInterceptor(testClient);
attachRefreshInterceptor(ebookClient);
attachRefreshInterceptor(paymentClient);
attachRefreshInterceptor(toolClient);
attachRefreshInterceptor(mentorshipClient);