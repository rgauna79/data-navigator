import React from "react";
import { useAuth } from "../context/AuthContext";
function HomePage() {
  const { user, isLoggedIn } = useAuth();
  return (
    <div className="flex-1 flex justify-center items-center bg-gray-500">
      <h1>Home Page</h1>
      {isLoggedIn && <p>Welcome, {user.username}!</p>}
    </div>
  );
}

export default HomePage;
