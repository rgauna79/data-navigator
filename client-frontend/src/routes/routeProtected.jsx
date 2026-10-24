import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../i18n/I18nContext.jsx";

export const PrivateRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useI18n();
  if (isLoading)
    return (
      <div className="flex-1 flex justify-center items-center text-gray-400 py-20">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <span className="ml-3">{t("Loading...")}</span>
      </div>
    );
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};
