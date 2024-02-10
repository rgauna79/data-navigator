import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile } from "../context/UserContext";

function ProfilePage() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTogglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    setFormData({
      ...formData,
      password: "", // Clear password field when toggling visibility
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // function to update user profile
      await updateUserProfile(formData);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      // console.log(error);
      setErrorMessage(error.message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-500">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-white">Profile</h1>
        {successMessage && (
          <p className="text-green-500 mb-4">{successMessage}</p>
        )}
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-white mb-2">
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border border-gray-400 p-2 rounded"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-white mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-400 p-2 rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="checkbox"
              id="togglePasswordFields"
              onChange={handleTogglePasswordFields}
              className="mr-2"
            />
            <label htmlFor="togglePasswordFields" className="text-white">
              Change Password
            </label>
          </div>
          {showPasswordFields && (
            <div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-white mb-2">
                  New Password:
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-400 p-2 rounded"
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
