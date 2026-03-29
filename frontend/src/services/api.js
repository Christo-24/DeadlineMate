import axios from 'axios';
import { getAuthHeader } from './auth';

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
  const response = await api.put(`/tasks/${id}/`, taskData);
  return response.data;
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
