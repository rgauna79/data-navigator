import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast"; // ✅ Importamos toast

export const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { signup, errors: authErrors, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const onSubmit = async (data) => {
    try {
      await signup(data);
      // El Toast de bienvenida lo mandará el HomePage
    } catch (error) {
      toast.error("Registration failed. Please check your data.");
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-50 dark:bg-gray-900  px-4 py-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 sm:p-10 rounded-[2rem] shadow-sm">
        <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">
          Create account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
          Join Data Navigator today. It's free!
        </p>

        {authErrors && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-bold mb-6">
            {authErrors}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {[
            {
              id: "username",
              label: "Username",
              type: "text",
              placeholder: "johndoe",
              rules: { required: "Username is required" },
            },
            {
              id: "email",
              label: "Email Address",
              type: "email",
              placeholder: "you@example.com",
              rules: {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
              },
            },
            {
              id: "password",
              label: "Password",
              type: "password",
              placeholder: "••••••••",
              rules: {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              },
            },
          ].map(({ id, label, type, placeholder, rules }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                {label}
              </label>
              <input
                type={type}
                id={id}
                placeholder={placeholder}
                className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium ${
                  errors[id]
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
                {...register(id, rules)}
              />
              {errors[id] && (
                <p className="text-red-500 text-xs font-bold mt-1.5 ml-1">
                  {errors[id].message}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 text-sm mt-4"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
