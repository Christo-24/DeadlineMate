import axios from 'axios';
import { getAuthHeader, refreshAccessToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add auth header to all requests
api.interceptors.request.use((config) => {
  const headers = getAuthHeader();
  config.headers = { ...config.headers, ...headers };
  return config;
});

// Handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token is invalid (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await refreshAccessToken();
        
        // Retry the original request with new token
        const headers = getAuthHeader();
        originalRequest.headers = { ...originalRequest.headers, ...headers };
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Tasks API
export const getTasks = async () => {
  const response = await api.get('/tasks/');
  return response.data;
};

export const getTask = async (id) => {
  const response = await api.get(`/tasks/${id}/`);
  return response.data;
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}/`, taskData);
    return response.data;
  } catch (error) {
    console.error('Update Task API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}/`);
};

export const getPendingTasks = async () => {
  const response = await api.get('/tasks/pending/');
  return response.data;
};

export const getCompletedTasks = async () => {
  const response = await api.get('/tasks/completed/');
  return response.data;
};

export const markTaskComplete = async (id) => {
  const response = await api.post(`/tasks/${id}/mark-complete/`);
  return response.data;
};

export const markTaskIncomplete = async (id) => {
  const response = await api.post(`/tasks/${id}/mark-incomplete/`);
  return response.data;
};

// Profile API
export const getCurrentUser = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

// Export the axios instance for direct API calls
export { api };
