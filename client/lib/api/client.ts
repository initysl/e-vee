import axios, { AxiosInstance } from 'axios';
import { getSession } from '@/lib/session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Use getSession from session.ts
export const getSessionId = getSession;

export const clearSessionId = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('shophub_session_id');
  }
};

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

// Response interceptor (keep existing error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
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
