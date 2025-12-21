import axios, { AxiosInstance } from 'axios';
import { clearSession, getSession } from '@/lib/session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

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

    if (sessionId) {
      config.headers['session-id'] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.code === 'ERR_NETWORK') {
      console.error(
        'Network Error: Cannot reach backend. Check CORS and backend is running.'
      );
    }
    return Promise.reject(error);
  }
);

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL.replace('/api', '')}/health`
    );
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};
