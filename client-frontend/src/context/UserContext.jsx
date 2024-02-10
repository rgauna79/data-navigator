import { getUserProfileRequest } from "../api/auth";
import { updateUserProfileRequest } from "../api/auth";

export const getUserProfile = async () => {
  try {
    const response = await getUserProfileRequest();
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const updateUserProfile = async (user) => {
  try {
    const response = await updateUserProfileRequest(user);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};
