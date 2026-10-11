import {  signInWithPopup, GoogleAuthProvider, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase.config";
import {  useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

const Login = () => {
       const provider = new GoogleAuthProvider();
       const [loading, setLoading] = useState(false);
       const [message, setMessage] = useState({ type: '', text: '' });
       const navigate = useNavigate();
// Google login (firebase authentication)
 const googleLogin = () => {
 setLoading(true);
    signInWithPopup(auth, provider)
  .then((result) => {
  
    const user = result.user;
    console.log(user);
 
    setLoading(false);
      navigate("/");
  }).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.log(errorCode, errorMessage, email, credential);
    // ...
    setLoading(false);
  
  });
 };
//  React hook 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) =>{
    const auth = getAuth();
    const { email, password } = data;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("signed in", user);
        setMessage({ type: 'success', text: 'Login successful!' });
        navigate("/");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("sign in error", errorCode, errorMessage);
        setMessage({ type: 'error', text: 'Invalid email or password.' });
      });
  }


  
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
     <div className="card-title text-center text-4xl text-black font-bold mt-10">Login Now!</div>
    <div className="card bg-base-100 w-[500px] max-w-sm shrink-0 shadow-2xl">
       
      <div className="card-body">
        <form className="fieldset" onSubmit={handleSubmit(onSubmit)}>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="Email" {...register("email")} />
          <label className="label">Password</label>
          <input type="password" className="input" placeholder="Password" {...register("password")} />
          <div><a className="link link-hover">Forgot password?</a></div>
          <button type="submit" className="btn btn-neutral mt-4">Login</button>
          {message.text && (
            <p className={message.type === 'success' ? 'text-green-500' : 'text-red-500'}>
              {message.text}
            </p>
          )}
        </form>
          <p className="text-center my-5">Or</p>
          <button className="btn btn-warning mb-5" onClick={() => googleLogin()}>Login with Google</button>
          <p className="text-center">Don't have an account? <Link to="/auth/register" className="link link-hover">Register</Link></p>
      </div>
    </div>
  </div>
      </div>
    </div>
  )
}

export default Login
