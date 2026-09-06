import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user } = useAuth();
    const location = useLocation();

    // Not logged in — preserve the attempted URL in location.state.returnTo
    // so Login can redirect back after successful authentication.
    if (!user) {
        return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
    }

    // Logged in but wrong role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
