// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserRole } from "../utiles/getUserRole";

function PrivateRoute({ children, requiredRole }) {
  const reduxToken = useSelector((state) => state.auth.token);
  const localToken = localStorage.getItem("token"); // admin-token أو token من backend
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // اختر أي token موجود (redux أولًا، ثم local)
  const token = reduxToken || localToken;

  // الدور: إذا admin محلي، نخليه admin مباشرة
  let role;
  if (isAdmin) role = "admin";
  else if (token) {
    try { role = getUserRole(token); }
    catch (e) { role = null; }
  }

  // إذا ما في token → للـ login
  if (!token) return <Navigate to="/login" replace />;

  // إذا فيه requiredRole والـ role ما تطابق → للـ login
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />;

  return children;
}

export default PrivateRoute;
