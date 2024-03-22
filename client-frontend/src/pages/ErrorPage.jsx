import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function ErrorPage() {
  const { error } = useAuth();
  return (
    <div className="flex-1 flex justify-center items-center bg-gray-500">
      <span className="ml-2">Page not found</span>
      {error && <span className="ml-2">Error: {error}</span>}
    </div>
  );
}

export default ErrorPage;
