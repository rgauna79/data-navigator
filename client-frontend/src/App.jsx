import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NavigationBar from "./components/ui/NavigationBar.jsx";
import FileReaderPage from "./pages/FileReaderPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Footer from "./components/ui/Footer.jsx";
import ChartPage from "./pages/ChartPage.jsx";
import DbSheetPage from "./pages/DbSheetPage.jsx";
import SavedReportsPage from "./pages/SavedReportsPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import { PrivateRoute } from "../src/routes/routeProtected";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          <NavigationBar />
          <DataProvider>
            <main className="flex-1 flex flex-col">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<ErrorPage />} />
                <Route path="/fileReader" element={<FileReaderPage />} />
                <Route path="/charts" element={<ChartPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route element={<PrivateRoute />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/savedfiles" element={<DbSheetPage />} />
                  <Route path="/reports" element={<SavedReportsPage />} />
                </Route>
              </Routes>
            </main>
          </DataProvider>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;