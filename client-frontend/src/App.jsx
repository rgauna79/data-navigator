import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // ✅ Importamos el Toaster
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ExcelProvider } from "./context/ExcelContext";
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
        <ExcelProvider>
          <DataProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 min-w-[320px] overflow-x-hidden">
              {" "}
              <NavigationBar />
              {/* ✅ Configuramos las notificaciones globales */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#333",
                    color: "#fff",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "14px",
                  },
                  success: {
                    style: { background: "#059669" }, // Emerald 600
                  },
                  error: {
                    style: { background: "#DC2626" }, // Red 600
                  },
                }}
              />
              <main className="flex-1 flex flex-col w-full">
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
              <Footer />
            </div>
          </DataProvider>
        </ExcelProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
