import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NavigationBar from "./components/NavigationBar.jsx";
import FileReaderPage from "./pages/FileReaderPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Footer from "./components/Footer.jsx";
import ChartPage from "./pages/ChartPage.jsx";
import DbSheetPage from "./pages/DbSheetPage.jsx";
import { PrivateRoute } from "../src/routes/routeProtected";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationBar />
        <DataProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<ErrorPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/fileReader" element={<FileReaderPage />} />
              <Route path="/charts" element={<ChartPage />} />
              <Route path="/savedfiles" element={<DbSheetPage />} />
            </Route>
          </Routes>
        </DataProvider>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
