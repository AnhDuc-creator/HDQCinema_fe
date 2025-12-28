import { Navigate } from "react-router-dom";

const UserProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  if (user.role && (user.role === "admin" || user.role === "manager")) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default UserProtectedRoute;
