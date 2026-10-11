import { MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';


import { Link} from 'react-router';
import logo from '../../assets/image/logo.png';
import {  useState } from 'react';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/auth';
import { auth } from '../../../firebase.config';

const Nav = () => {
  const { user, loading: authLoading } = useAuth();
  const[loading, setLoading] = useState(false);

  const logout = () => {
    setLoading(true);
    signOut(auth).then(() => {
      console.log('User signed out successfully');
      setLoading(false);
   
  // Sign-out successful.
}).catch((error) => {
  console.log(error);
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
      <div className="navbar flex justify-between bg-[#EAE7DE] px-4 py-2">
        <div className="navbar-start hidden lg:flex">
           <ul className="menu menu-horizontal px-1 flex gap-4 items-center text-black">
             <li><Link to="/" className="text-black">Home</Link></li>
             <li><Link to="/shop" className="text-black">Shop</Link></li>
             <li><Link to="/about" className="text-black">About</Link></li>
             <li><Link to="/contact" className="text-black">Contact</Link></li>
             <li><Link to="/dashboard" className="text-black">Dashboard</Link></li>
           </ul>
         </div>
         <div className="navbar-center w-23 h-15">
           <Link to="/"><img className="" src={logo} alt="Logo" /></Link>
         </div>
         <div className="navbar-end flex gap-3 items-center text-black">
       
         {authLoading ? null : user ? (
          <>
            <img
              src={user.photoURL }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <button type="button" onClick={logout} className="text-black">
              {user.displayName || 'User'}, Logout
            </button>
          </>
          ) : (
            <Link to="/auth/login" className="text-black">Login / Sign up</Link>
          )}
       

           <MagnifyingGlassIcon className="size-6" />
           <button type="button" className="relative">
             <ShoppingCartIcon className="size-6" />
           
           </button>

         
         </div>
       </div>
     </div>
 );
};

export default Nav;
