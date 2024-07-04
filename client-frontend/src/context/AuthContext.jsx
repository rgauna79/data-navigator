//AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerRequest,
  loginRequest,
  verifyTokenRequest,
  logoutRequest,
} from "../api/auth.js";
import Cookies from "js-cookie";

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
        setError([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const signup = async (user) => {
    try {
      const response = await registerRequest(user);
      if (response.status === 200) {
        setUser(response.data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      if (error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.response.data.error) {
        setError(error.response.data.error);
      }
    }
  };

  const login = async (user) => {
    try {
      const response = await loginRequest(user);
      setIsLoggedIn(true);
      setUser(response.data);
    } catch (error) {
      if (error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.response.data.error) {
        setError(error.response.data.error);
      }
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setUser(null);
    Cookies.remove("authToken");
    await logoutRequest();
  };

  useEffect(() => {
    async function checkLogin() {
      setIsLoading(true);
      // Check if there's a cookie
      const cookie = Cookies.get();
      if (!cookie) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return setUser(null);
      }
      try {
        const response = await verifyTokenRequest(cookie.authToken);
        if (!response.data) {
          return setIsLoggedIn(false);
        }
        setUser(response.data);
        setIsLoggedIn(true);
        setIsLoading(false);
      } catch (error) {
        setIsLoggedIn(false);
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
