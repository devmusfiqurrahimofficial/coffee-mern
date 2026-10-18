import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/auth';
import { isAdminEmail } from '../utils/admin';

export const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-5 text-[var(--color-text)]">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    if (!isAdminEmail(user.email)) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EAE7DE] p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                    Restricted area
                </p>
                <h1 className="font-serif text-4xl font-black text-[var(--color-text)]">
                    Admin access only
                </h1>
                <p className="max-w-md text-sm text-neutral-500">
                    The dashboard is limited to administrators. You are signed in as{" "}
                    <span className="font-semibold text-[var(--color-text)]">{user.email}</span>, which
                    does not have admin permission.
                </p>
                <Link
                    to="/"
                    className="mt-2 rounded-full bg-[var(--color-text)] px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary)]"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return children;
}
