//AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerRequest,
  loginRequest,
  verifyTokenRequest,
  logoutRequest,
} from "../api/auth.js";
import { useCookies } from "react-cookie";

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
  const [cookies, setCookie, removeCookie] = useCookies(["authToken"]);

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
      setCookie("authToken", response.data.token, {
        path: "/",
      });
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
    removeCookie("authToken");
    await logoutRequest();
  };

  useEffect(() => {
    async function checkLogin() {
      const cookie = cookies.authToken;

      if (!cookie) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return setUser(null);
      }
      try {
        const response = await verifyTokenRequest();
        setUser(response.data);
        setIsLoggedIn(true);
        setIsLoading(false);
      } catch (error) {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    }
    checkLogin();
  }, [cookies.authToken]);

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
