import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../firebase.config";

export const  useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previousUser, setPreviousUser] = useState(null);

    useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (previousUser && !currentUser) {
          try {
            localStorage.removeItem("wishlist");
          } catch {
            // storage unavailable — ignore
          }
        }
        setUser(currentUser);
        setPreviousUser(currentUser);
        setLoading(false);
     });

return () => unsubscribe();

    }, [previousUser]);
return { user, loading };
   
}
