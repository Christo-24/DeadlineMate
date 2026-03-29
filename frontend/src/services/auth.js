import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, {
      username,
      password,
    });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('username', username);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const refreshAccessToken = async () => {
  try {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${API_URL}/token/refresh/`, {
      refresh: refresh_token,
    });
    
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error.response?.data || error;
  }
};

export const register = async (username, email, password, first_name = '', last_name = '') => {
  try {
    const response = await axios.post(`${API_URL}/register/`, {
      username,
      email,
      password,
      first_name,
      last_name,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
};

export const validateToken = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    return parts.length === 3;
  } catch {
    return false;
  }
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
  };
};
