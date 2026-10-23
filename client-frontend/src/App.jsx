import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NavigationBar from "./components/ui/NavigationBar.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Footer from "./components/ui/Footer.jsx";
import { PrivateRoute } from "./routes/routeProtected";

// Páginas con dependencias pesadas (xlsx, chart.js, jspdf, html2canvas)
// se cargan solo cuando se visitan
const FileReaderPage = lazy(() => import("./pages/FileReaderPage.jsx"));
const ChartPage = lazy(() => import("./pages/ChartPage.jsx"));
const DbSheetPage = lazy(() => import("./pages/DbSheetPage.jsx"));

const PageLoader = () => (
  <div className="flex-1 flex justify-center items-center py-20 text-gray-400">
    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* ✅ flex col + min-h-screen hace que el footer siempre quede al fondo */}
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          <NavigationBar />
          <DataProvider>
            {/* flex-1 hace que este div crezca y empuje el footer hacia abajo */}
            <main className="flex-1 flex flex-col">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<ErrorPage />} />
                  <Route path="/fileReader" element={<FileReaderPage />} />
                  <Route path="/charts" element={<ChartPage />} />
                  <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/savedfiles" element={<DbSheetPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </main>
          </DataProvider>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
