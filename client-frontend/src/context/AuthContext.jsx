//AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerRequest,
  loginRequest,
  verifyTokenRequest,
  logoutRequest,
} from "../api/auth.js";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setError] = useState(null);

  //Clear errors after 5 seconds
  useEffect(() => {
    if (errors) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const signup = async (user) => {
    try {
      const response = await registerRequest(user);
      if (response.status === 200 || response.status === 201) {
        setUser(response.data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      const data = error.response?.data;
      setError(data?.message || data?.error || "Registration failed");
    }
  };

  const login = async (user) => {
    try {
      const response = await loginRequest(user);
      setIsLoggedIn(true);
      setUser(response.data);
    } catch (error) {
      const data = error.response?.data;
      setError(data?.message || data?.error || error.message || "Login failed");
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setUser(null);
    try {
      await logoutRequest();
    } catch (error) {
      // El logout debe limpiar el estado local incluso si la petición falla
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await verifyTokenRequest();
        if (!response.data) {
          setIsLoggedIn(false);
          setUser(null);
        } else {
          setUser(response.data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        // Si da 401 (Unauthorized), el catch lo maneja silenciosamente
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkLogin();
  }, []);

  const value = {
    user,
    isLoggedIn,
    isLoading,
    errors,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
