// src/pages/RegisterPage.jsx
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";

function RegisterPage() {
  const {
    register,
    isLoggedIn,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signup, errors: authErrors } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = "/";
    }
  }, [isLoggedIn]);

  const onSubmit = async (data) => {
    try {
      await signup(data);
      window.location.href = "/";
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-500">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        {authErrors && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="block">{authErrors}</strong>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-4">Register Page</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="username" className="block font-bold mb-2">
              Username:
            </label>
            <input
              type="text"
              id="username"
              className="border border-gray-400 p-2 w-full"
              {...register("username", { required: true })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="border border-gray-400 p-2 w-full"
              {...register("email", { required: true })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block font-bold mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              className="border border-gray-400 p-2 w-full"
              {...register("password", { required: true })}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
