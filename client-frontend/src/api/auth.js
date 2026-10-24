import axios from "./axios";

export const registerRequest = (user) => axios.post(`/auth/register`, user);

export const loginRequest = (user) => axios.post(`/auth/login`, user);

export const logoutRequest = () => axios.post(`/auth/logout`);

// El servidor lee la cookie automáticamente
export const verifyTokenRequest = () => axios.get(`/auth/verify`);

export const getUserProfileRequest = () => axios.get(`/users/profile`);

export const updateUserProfileRequest = (user) =>
  axios.put(`/users/profile`, user);

export const getUserProfile = async () => {
  try {
    const response = await getUserProfileRequest();
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const updateUserProfile = async (user) => {
  try {
    const response = await updateUserProfileRequest(user);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Update failed");
  }
};
