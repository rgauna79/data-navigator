import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast"; // ✅ Importamos toast

function LoginPage() {
  const navigate = useNavigate();
  const { login, errors: loginErrors, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData);
    } catch (error) {
      toast.error("Invalid email or password"); // ✅ Toast de error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-50 dark:bg-gray-900  px-4 py-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 sm:p-10 rounded-[2rem] shadow-sm">
        <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
          Sign in to access your data and reports.
        </p>

        {loginErrors && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-bold mb-6">
            {loginErrors}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl px-4 py-3 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 text-sm mt-4"
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
