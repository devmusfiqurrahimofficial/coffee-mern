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

// Turns any error (Firebase or RTK Query) into readable text
const getErrorText = (error) => {
  if (error?.status === "FETCH_ERROR") {
    return "Cannot reach the server. Is it running on port 5000?";
  }
  if (error?.status) {
    return `Server error ${error.status}: ${error.data?.error || "unknown error"}`;
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
  const fetchAndStoreToken = async (email) => {
    const { token } = await generateJWT(email).unwrap();
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

      await fetchAndStoreToken(result.user.email);
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

      await fetchAndStoreToken(userCredential.user.email);

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