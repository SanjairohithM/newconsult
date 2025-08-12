// API Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';

// Development: localhost:5000, Production: Render backend domain
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_API_URL || 'https://newconsult-backend.onrender.com';

// Socket.IO URL (same as API for now)
const SOCKET_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_SOCKET_URL || API_BASE_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
  APPOINTMENTS: `${API_BASE_URL}/api/appointments`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  MESSAGES: `${API_BASE_URL}/api/messages`,
  COUNSELORS: `${API_BASE_URL}/api/counselors`,
  HEALTH: `${API_BASE_URL}/api/health`,
};

export { SOCKET_URL };
export default API_BASE_URL;
