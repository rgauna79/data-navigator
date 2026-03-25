import axios from "./axios";

export const registerRequest = (user) => axios.post(`/auth/register`, user);

export const loginRequest = (user) => axios.post(`/auth/login`, user);

export const logoutRequest = () => axios.post(`/auth/logout`);

// Simplificado: El servidor leerá la cookie automáticamente
export const verifyTokenRequest = () => axios.get(`/auth/verify`);

// export const verifyTokenRequest = (token) => axios.get(`auth/verify`, token);

export const getUserProfileRequest = () => axios.get(`/users/profile`);

export const updateUserProfileRequest = (user) =>
  axios.put(`/users/profile`, user);
