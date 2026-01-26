import axios, { AxiosInstance } from 'axios';
import { clearSession, getSession } from '@/lib/session';

function normalizeBaseUrl(url: string) {
  // remove trailing slashes
  let out = url.trim().replace(/\/+$/, '');

  // if we're on an https page, never allow http API calls
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    out = out.replace(/^http:\/\//i, 'https://');
  }

  return out;
}

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const API_BASE_URL = normalizeBaseUrl(RAW_BASE);

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
});

export const getSessionId = getSession;
export const clearSessionId = clearSession;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const sessionId = getSession();
    if (sessionId) config.headers['session-id'] = sessionId;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Cannot reach backend (URL/CORS/down).');
    }
    return Promise.reject(error);
  },
);

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Only remove a trailing "/api" (not any random "api" elsewhere)
    const origin = API_BASE_URL.replace(/\/api$/i, '');
    const healthUrl = `${origin}/health`;

    const response = await axios.get(healthUrl);
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};
