import axios from "axios";

// Determine API base URL — in production builds, use relative /api path
const API_BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : `${window.location.origin}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // send httpOnly cookies (refreshToken)
});

let isRefreshing = false;
let failedQueue = [];

// High-speed client cache for instant repeat navigation
const requestCache = new Map();
const CACHE_TTL_MS = 60000; // 60 seconds

export function clearApiCache() {
    requestCache.clear();
}

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor: attach Access Token + serve from client cache
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Fast-path client cache for public GET endpoints (events, tickets)
    if (config.method === "get" && !token) {
        const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
        const cached = requestCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            config.adapter = () => Promise.resolve({
                data: cached.data,
                status: 200,
                statusText: "OK",
                headers: {},
                config
            });
        }
    }
    return config;
});

// Response interceptor: populate cache & handle 401 with silent /refresh
api.interceptors.response.use(
    (response) => {
        // Cache successful public GET responses
        if (response.config.method === "get" && !response.config.headers?.Authorization) {
            const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
            requestCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/login") &&
            !originalRequest.url.includes("/auth/register") &&
            !originalRequest.url.includes("/auth/refresh")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await api.post("/auth/refresh");
                const newAccessToken = res.data.data.accessToken;

                localStorage.setItem("accessToken", newAccessToken);
                if (res.data.data.user) {
                    localStorage.setItem("user", JSON.stringify(res.data.data.user));
                }

                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
