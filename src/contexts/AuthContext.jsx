import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false,
};

// Action types
const AUTH_SUCCESS = 'AUTH_SUCCESS';
const AUTH_FAILURE = 'AUTH_FAILURE';
const LOGOUT = 'LOGOUT';
  const SET_LOADING = 'SET_LOADING';

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set token in API headers and localStorage
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Watch for token changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token && !state.token) {
        // Token was set in localStorage (likely from login), verify it
        const checkAuth = async () => {
          try {
            const response = await api.get('/auth/me');
            dispatch({
              type: AUTH_SUCCESS,
              payload: {
                user: response.data.user,
                token: token,
              },
            });
          } catch (error) {
            console.error('Auth verification failed:', error);
            dispatch({ type: AUTH_FAILURE });
          }
        };
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          dispatch({
            type: AUTH_SUCCESS,
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: AUTH_FAILURE });
        }
      } else {
        dispatch({ type: SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const response = await api.post('/auth/login', credentials);
      
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return response.data;
    } catch (error) {
      dispatch({ type: AUTH_FAILURE });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const response = await api.post('/auth/register', userData);
      
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return response.data;
    } catch (error) {
      dispatch({ type: AUTH_FAILURE });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: LOGOUT });
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin' || state.user?.role === 'staff';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;