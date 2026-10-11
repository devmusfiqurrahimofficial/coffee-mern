// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPcfxMvl8HS4nRqHwCPAcnNdZI9nDVU4I",
  authDomain: "coffee-mern.firebaseapp.com",
  projectId: "coffee-mern",
  storageBucket: "coffee-mern.firebasestorage.app",
  messagingSenderId: "601893925017",
  appId: "1:601893925017:web:ad9b6e9f21939e34c30808"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);