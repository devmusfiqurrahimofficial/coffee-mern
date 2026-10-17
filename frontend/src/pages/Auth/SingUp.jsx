
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { auth } from '../../../firebase.config';
import { useState } from 'react';

const getErrorText = (error) => {
  const firebaseErrorMap = {
    "auth/email-already-exists": "An account with this email already exists. Please log in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/operation-not-allowed": "Email/password accounts are not enabled. Contact support.",
  };
  if (error?.code && firebaseErrorMap[error.code]) {
    return firebaseErrorMap[error.code];
  }
  return error?.message || "Something went wrong.";
};

const SingUp = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const navigate = useNavigate();

    const {
    register,
    handleSubmit,
  } = useForm()

  const onSubmit = (data) => {
     const { name, email, password } = data;
    setLoading(true);
    setMessage({ type: "", text: "" });
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user && user.uid) {
        return updateProfile(auth.currentUser, { displayName: name });
      }
    })
    .then(() => {
      setMessage({ type: "success", text: "Account created successfully!" });
      setLoading(false);
      navigate("/");
    })
    .catch((error) => {
      setMessage({ type: "error", text: getErrorText(error) });
      setLoading(false);
    });
  }

if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-black">
        Loading...
      </div>
    );
  }
  return (
    <div>
        <div className="hero min-h-screen bg-[#EAE7DE]">
  <div className="hero-content flex-col ">
     <div className="card-title text-center text-4xl text-black font-bold mt-10">Register Now!</div>
    <div className="card bg-base-100 w-[500px] max-w-sm shrink-0 shadow-2xl">
      
      <div className="card-body">
        <form className="fieldset" onSubmit={handleSubmit(onSubmit)}>
             <label className="label">Name</label>
          <input type="text" className="input" placeholder="Name" {...register("name")} />
           
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="Email" {...register("email")} />
          <label className="label">Password</label>
          <input type="password" className="input" placeholder="Password" {...register("password")} />
    
          <button type="submit" className="btn btn-neutral mt-4">Register</button>
      
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
          <p className="text-center">Already have an account? <Link to="/auth/login" className="link link-hover">Login</Link></p>
      </div>
    </div>
  </div>
      </div>
    </div>
  )
}

export default SingUp
