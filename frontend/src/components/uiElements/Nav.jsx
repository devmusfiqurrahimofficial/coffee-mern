import { MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';


import { Link} from 'react-router';
import logo from '../../assets/image/logo.png';
import { useContext, useState } from 'react';
import { DataContext } from '../../contexApi/ContexApi';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase.config';

const Nav = () => {
  const {userData} = useContext(DataContext);
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
           </ul>
         </div>
         <div className="navbar-center w-23 h-15">
           <Link to="/"><img className="" src={logo} alt="Logo" /></Link>
         </div>
         <div className="navbar-end flex gap-3 items-center text-black">
       
          {userData?.uid ? (<Link onClick={()=>logout()} className="text-black">{userData.displayName}, Logout</Link>) : (  <Link to= "/auth/login" className="text-black"> Login / Sign up</Link>)}
            
          
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
