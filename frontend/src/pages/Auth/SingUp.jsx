
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { auth } from '../../../firebase.config';
import { useState } from 'react';

const SingUp = () => {
    const[loading, setLoading] = useState(false);
    // create user with firebaser
const nevigate = useNavigate();

    // react hook form
      const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) =>{
     const{name, email, password } = data;
    setLoading(true);
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log(user);
  
  if(user && user.uid){
        updateProfile(auth.currentUser, {
  displayName: name
}).then(() => {
  // Profile updated!
  // ...
}).catch((error) => {
  // An error occurred
  console.log(error);
  // ...
});
  }
    setLoading(false);
    nevigate("/");

       
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
      setLoading(false);
      // ..
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
       
          <button type="submit" className="btn btn-neutral mt-4" onClick={() => createUser()}>Register</button>
        
        </form>
          <p className="text-center">Already have an account? <Link to="/auth/login" className="link link-hover">Login</Link></p>
      </div>
    </div>
  </div>
      </div>
    </div>
  )
}

export default SingUp
