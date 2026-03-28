import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile } from "../context/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast"; // ✅ Importamos toast

function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, email: user.email, password: "" });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTogglePassword = () => {
    setChangePassword((v) => !v);
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // ✅ Toast automático con Loader, Success y Error integrados
    toast
      .promise(updateUserProfile(formData), {
        loading: "Updating profile...",
        success: "Profile updated successfully!",
        error: (err) => err.message || "Could not update profile.",
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-gray-400 text-3xl"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200 dark:shadow-none flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {user?.username}
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">
            Account Settings
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="togglePassword"
                checked={changePassword}
                onChange={handleTogglePassword}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="togglePassword"
                className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                Update password
              </label>
            </div>

            {changePassword && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                  New password
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="text-sm"
                    />
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 text-sm mt-4"
            >
              {isSaving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Saving changes...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
