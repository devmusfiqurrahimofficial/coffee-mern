import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import logo from "../../assets/image/logo.png";
import { useGenerateJWTMutation } from "../../redux/api/userApi/userApi";
import { isAdminEmail } from "../../utils/admin";

const getErrorText = (error) => {
  if (error?.status === "FETCH_ERROR") {
    return "Cannot reach the server. Is it running on port 5000?";
  }
  if (error?.status) {
    return `Server error ${error.status}: ${error.data?.error || "unknown error"}`;
  }
  switch (error?.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return error?.message || "Something went wrong.";
  }
};

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [generateJWT] = useGenerateJWTMutation();

  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Please enter your email and password." });
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!isAdminEmail(credential.user.email)) {
        await signOut(auth);
        setMessage({
          type: "error",
          text: "This account does not have admin access to the dashboard.",
        });
        return;
      }

      const { token } = await generateJWT(credential.user.email).unwrap();
      localStorage.setItem("access-token", token);

      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error("Admin sign in error:", error);
      setMessage({ type: "error", text: getErrorText(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAE7DE] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-6">
            <img src={logo} alt="Coffee Mern" className="h-14 w-auto" />
          </Link>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Admin Portal
          </span>
          <h1 className="font-serif text-3xl font-black text-[#1d1d1d]">
            Dashboard Login
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your administrator email and password to continue.
          </p>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-600"
              >
                <EnvelopeIcon className="h-4 w-4 text-neutral-400" />
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coffeemern.com"
                autoComplete="username"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-600"
              >
                <LockClosedIcon className="h-4 w-4 text-neutral-400" />
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-[#e11d48]"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message.text && (
              <p
                role="alert"
                className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-[#e11d48]/30 bg-[#e11d48]/10 text-[#c81a40]"
                }`}
              >
                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e11d48] py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <LockClosedIcon className="h-4 w-4" />
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Only administrator accounts can access the dashboard
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-neutral-500 transition hover:text-[#1d1d1d]"
          >
            &larr; Back to store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
