import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useGenerateJWTMutation } from "../../redux/api/userApi/userApi";
import { API_BASE_URL } from "../../utils/apiConfig";

// Turns any error (Firebase or RTK Query) into readable text
const getErrorText = (error) => {
  if (error?.status === "FETCH_ERROR") {
    return `Cannot reach the server at ${API_BASE_URL}.`;
  }
  if (error?.status) {
    // express-validator failures arrive as { errors: [{ msg, path }] };
    // hand-written handlers use { error: "message" }.
    const validationText = Array.isArray(error.data?.errors)
      ? error.data.errors.map((item) => item.msg).join(" ")
      : "";
    return `Server error ${error.status}: ${error.data?.error || validationText || "unknown error"}`;
  }

  // Map common Firebase auth error codes to user-friendly messages
  const firebaseErrorMap = {
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };

  if (error?.code && firebaseErrorMap[error.code]) {
    return firebaseErrorMap[error.code];
  }
  return error?.code || error?.message || "Something went wrong.";
};

const Login = () => {
  const provider = new GoogleAuthProvider();
  const [loading, setLoading] = useState(false);
  const [generateJWT] = useGenerateJWTMutation();
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/";

  // Ask the backend for a JWT and keep it for later API calls.
  // Proves account ownership with a Firebase ID token (never a raw email).
  const fetchAndStoreToken = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const { token } = await generateJWT(idToken).unwrap();
    localStorage.setItem("access-token", token);
    return token;
  };

  // Google login (firebase authentication)
  const googleLogin = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const auth = getAuth();
      const result = await signInWithPopup(auth, provider);

      if (!result.user?.email) {
        throw new Error("Your Google account has no email.");
      }

      await fetchAndStoreToken(result.user);
      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error("Google login failed:", error);
      setMessage({ type: "error", text: getErrorText(error) });
    } finally {
      setLoading(false);
    }
  };

  // React hook form
  const { register, handleSubmit } = useForm();

  // Email + password login (firebase authentication)
  const onSubmit = async (data) => {
    const { email, password } = data;
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      await fetchAndStoreToken(userCredential.user);

      setMessage({ type: "success", text: "Login successful!" });
      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      setMessage({ type: "error", text: getErrorText(error) });
    } finally {
      setLoading(false);
    }
  };

  // loading state handle
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-black">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="hero min-h-screen bg-[#EAE7DE]">
        <div className="hero-content flex-col ">
          <div className="card-title text-center text-4xl text-black font-bold mt-10">
            Login Now!
          </div>
          <div className="card bg-base-100 w-[500px] max-w-sm shrink-0 shadow-2xl">
            <div className="card-body">
              <form className="fieldset" onSubmit={handleSubmit(onSubmit)}>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="Email"
                  {...register("email")}
                />
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  {...register("password")}
                />
                <div>
                  <a className="link link-hover">Forgot password?</a>
                </div>
                <button type="submit" className="btn btn-neutral mt-4">
                  Login
                </button>
              </form>
              {message.text && (
                <p
                  className={
                    message.type === "success" ? "text-green-500" : "text-red-500"
                  }
                >
                  {message.text}
                </p>
              )}
              <p className="text-center my-5">Or</p>
              <button className="btn btn-warning mb-5" onClick={googleLogin}>
                Login with Google
              </button>
              <p className="text-center">
                Don't have an account?{" "}
                <Link to="/auth/register" className="link link-hover">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;