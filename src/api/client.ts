import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import { storage } from "../utils/storage";
import { useAuthStore } from "../store/auth.store";
import { recordError } from "../utils/crashlytics";

export const AUTH_BASE_URL = process.env.EXPO_PUBLIC_AUTH_API;
export const TEST_BASE_URL = process.env.EXPO_PUBLIC_TEST_API;
export const EBOOK_BASE_URL = process.env.EXPO_PUBLIC_EBOOK_API;
export const PAYMENT_BASE_URL = process.env.EXPO_PUBLIC_PAYMENT_API;
export const TOOL_BASE_URL = process.env.EXPO_PUBLIC_TOOL_API;
export const MENTORSHIP_BASE_URL = process.env.EXPO_PUBLIC_MENTORSHIP_API;
export const CHAT_BASE_URL = process.env.EXPO_PUBLIC_CHAT_API;

export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const toolClient = axios.create({
  baseURL: TOOL_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const mentorshipClient = axios.create({
  baseURL: MENTORSHIP_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const testClient = axios.create({
  baseURL: TEST_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ebookClient = axios.create({
  baseURL: EBOOK_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatClient = axios.create({
  baseURL: CHAT_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Refresh ke liye raw client, isme interceptor nahi lagana
const refreshClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const setupRetry = (client: AxiosInstance) => {
  axiosRetry(client, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const method = error.config?.method?.toLowerCase();
      const url = error.config?.url || "";

      if (method === "post" && url.includes("/auth/send-otp") && !error.response) {
        return true;
      }

      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.code === "ECONNABORTED" ||
        error.message?.includes("Network Error")
      );
    },
  });
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _client?: AxiosInstance;
};

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

const attachToken = (
  config: InternalAxiosRequestConfig,
  client: AxiosInstance
) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  (config as RetryConfig)._client = client;

  return config;
};

export const setDefaultAuthorizationHeader = (accessToken: string) => {
  authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  testClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  ebookClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  paymentClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  toolClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  mentorshipClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  chatClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

export const clearDefaultAuthorizationHeader = () => {
  delete authClient.defaults.headers.common.Authorization;
  delete testClient.defaults.headers.common.Authorization;
  delete ebookClient.defaults.headers.common.Authorization;
  delete paymentClient.defaults.headers.common.Authorization;
  delete toolClient.defaults.headers.common.Authorization;
  delete mentorshipClient.defaults.headers.common.Authorization;
  delete chatClient.defaults.headers.common.Authorization;
};

const refreshTokenAndRetry = async (error: AxiosError) => {
  const originalRequest = error.config as RetryConfig | undefined;

  if (!originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;

          const client = originalRequest._client || authClient;
          resolve(client(originalRequest));
        },
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const latestRefreshToken =
  useAuthStore.getState().refreshToken ||
  (await storage.get<string>("refresh_token"));

    if (!latestRefreshToken) {
      recordError(error, "client.ts: Missing refresh token");
      await useAuthStore.getState().clearTokens();
      return Promise.reject(error);
    }

    const response = await refreshClient.post("/auth/refresh", {
      refresh_token: latestRefreshToken,
    });

        const newAccessToken =
        response.data.access_token || response.data.accessToken;

      const newRefreshToken =
      response.data.refresh_token || response.data.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
      recordError(error, "client.ts: Refresh response missing tokens");
      return Promise.reject(error);
      }

    await useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

    setDefaultAuthorizationHeader(newAccessToken);

    processQueue(null, newAccessToken);

   originalRequest.headers = originalRequest.headers || {};
   originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    const client = originalRequest._client || authClient;

    return client(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);

      const status = refreshError?.response?.status;

      if (status === 401 || status === 403) {
        await useAuthStore.getState().clearTokens();
      }

      console.log("REFRESH TOKEN ERROR", refreshError);
      recordError(refreshError, "client.ts: Refresh Token Error");

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
    await useAuthStore.getState().setTokens(accessToken, refreshToken);
  }

  setDefaultAuthorizationHeader(accessToken);
};

const attachRefreshInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
    const url = error.config?.url || "";

    if (url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
      const message = JSON.stringify(error.response?.data || "").toLowerCase();

      if (
        status === 401 ||
        status === 403 ||
        (
          status === 400 &&
          (
            message.includes("token") ||
            message.includes("jwt") ||
            message.includes("expired") ||
            message.includes("unauthorized")
          )
        )
      ) {
        return refreshTokenAndRetry(error);
      }

      return Promise.reject(error);
    }
  );
};
setupRetry(authClient);
setupRetry(testClient);
setupRetry(ebookClient);
setupRetry(paymentClient);
setupRetry(toolClient);
setupRetry(mentorshipClient);
setupRetry(chatClient);

authClient.interceptors.request.use((config) =>
  attachToken(config, authClient)
);

testClient.interceptors.request.use((config) =>
  attachToken(config, testClient)
);

ebookClient.interceptors.request.use((config) =>
  attachToken(config, ebookClient)
);

paymentClient.interceptors.request.use((config) =>
  attachToken(config, paymentClient)
);

toolClient.interceptors.request.use((config) =>
  attachToken(config, toolClient)
);

mentorshipClient.interceptors.request.use((config) =>
  attachToken(config, mentorshipClient)
);

chatClient.interceptors.request.use((config) =>
  attachToken(config, chatClient)
);

attachRefreshInterceptor(authClient);
attachRefreshInterceptor(testClient);
attachRefreshInterceptor(ebookClient);
attachRefreshInterceptor(paymentClient);
attachRefreshInterceptor(toolClient);
attachRefreshInterceptor(mentorshipClient);
attachRefreshInterceptor(chatClient);