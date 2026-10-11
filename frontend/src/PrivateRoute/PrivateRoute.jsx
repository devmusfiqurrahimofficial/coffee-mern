import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/auth';

export const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

if (loading) {
    return <div className="flex min-h-screen items-center justify-center p-5 text-black">Loading...</div>;
}

if (user?.uid) {
    return children;
}

return <Navigate to="/auth/login" replace state={{ from: location }} />;
  
}
