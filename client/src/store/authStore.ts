import { create } from 'zustand';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  avatar?: string;
  department?: string;
  points: number;
  badges: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = localStorage.getItem('token');
  const initialUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  }

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    login: (token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      set({ token: null, user: null, isAuthenticated: false });
    },
    updateUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    }
  };
});
