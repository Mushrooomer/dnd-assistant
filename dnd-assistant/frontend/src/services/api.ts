import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  }
};

export const game = {
  createSession: async (data: { name: string; description: string }) => {
    const response = await api.post('/games', data);
    return response.data;
  },
  getGames: async () => {
    const response = await api.get('/games');
    return response.data;
  },
  getSession: async (id: string) => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },
  sendMessage: async (gameId: string, message: string) => {
    const response = await api.post(`/games/${gameId}/message`, { message });
    return response.data;
  },
  deleteGame: async (gameId: string) => {
    const response = await api.delete(`/games/${gameId}`);
    return response.data;
  }
}; 