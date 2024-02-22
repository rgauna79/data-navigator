import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NavigationBar from "./components/NavigationBar.jsx";
import FileReaderPage from "./pages/FileReaderPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Footer from "./components/Footer.jsx";
import ChartPage from "./pages/ChartPage.jsx";
import Modal from "./components/Modal.jsx";
import DbSheetPage from "./pages/DbSheetPage.jsx";
import { DataProvider } from "./context/DataContext";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <NavigationBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/filereader" element={<FileReaderPage />} />
            <Route path="/charts" element={<ChartPage />} />
            <Route path="/filereader/modal" element={<Modal />} />
            <Route path="/savedfiles" element={<DbSheetPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          <Footer />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
