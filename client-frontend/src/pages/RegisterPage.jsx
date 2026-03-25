import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { signup, errors: authErrors, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const onSubmit = async (data) => {
    try { await signup(data); } catch (error) { console.error(error); }
  };

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)] px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Create account</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Join Data Navigator today</p>

        {authErrors && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {authErrors}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { id: "username", label: "Username", type: "text", placeholder: "johndoe",
              rules: { required: "Username is required" } },
            { id: "email", label: "Email", type: "email", placeholder: "you@example.com",
              rules: { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } } },
            { id: "password", label: "Password", type: "password", placeholder: "••••••••",
              rules: { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } } },
          ].map(({ id, label, type, placeholder, rules }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
              </label>
              <input
                type={type} id={id} placeholder={placeholder}
                className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm ${errors[id] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                {...register(id, rules)}
              />
              {errors[id] && <p className="text-red-500 text-xs mt-1">{errors[id].message}</p>}
            </div>
          ))}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2">
            {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin /> Creating account...</> : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-gray-500 dark:text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;