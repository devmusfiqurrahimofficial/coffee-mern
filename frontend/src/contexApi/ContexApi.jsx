import { getAuth, onAuthStateChanged } from "firebase/auth";
import {  createContext, useEffect, useState } from "react";

export const DataContext = createContext();
const ContexApi = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productData, setProductData] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        fetch('https://dummyjson.com/products')
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setProductData(data.products);
                setDataLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setDataLoading(false);
            });
    }, []);

    const auth = getAuth();
useEffect(() => {
         const Unsubscribed=   onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in from context:", user);
           setUserData(user);
           setLoading(false);
        } else {
            setUserData(null);
          
           setLoading(false);
        }
        });


        return ()=>{
            Unsubscribed();
        };
    },
        
        [auth])

if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-black">
        Loading...
        </div>)
}
    const value = { userData, setUserData, productData, setProductData };
  return (
    <DataContext.Provider value={value}>
        {children}
    </DataContext.Provider>
  )
}

export default ContexApi
