import { jwtDecode } from 'jwt-decode';

export const getUserRole = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.role || decoded.userType || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};
