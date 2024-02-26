import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDc-B-2Dfcc59a-odkL0HWPv_-9xjpSMPo",
  authDomain: "swadify-b8a22.firebaseapp.com",
  projectId: "swadify-b8a22",
  storageBucket: "swadify-b8a22.appspot.com",
  messagingSenderId: "966964999731",
  appId: "1:966964999731:web:df1d242ada45a1596a9546"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default app;

