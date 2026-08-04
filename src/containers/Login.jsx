import React, { useState } from "react";
import { Form, Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth,db } from "../firebase.js";
import { useDispatch } from "react-redux";
import { loginUser,setLoading } from "../utils/Redux/userSlice";
import { doc, getDoc } from "firebase/firestore";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { toast } from "react-toastify";
import AuthLayout from "../components/AuthLayout";
import FormButton from "../components/FormButton";
import FormTitle from "../components/FormTitle.jsx";
import { useForm } from "react-hook-form";
import FormInput from "../components/FormInput.jsx";
import FormMessage from "../components/FormMessage.jsx";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup.object().shape({
    email: yup.string().required().email(),
    password: yup.string().required(),
})

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '', password: '',
    },
    resolver: yupResolver(schema),
  });
  const dispatch = useDispatch();
  const onlineStatus = useOnlineStatus();
  const navigate = useNavigate();
  const [shakeSignal, setShakeSignal] = useState(0);

  const onSubmit = async (data) => {
    console.log(data);
    try {
      const { email, password } = data;
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Dispatch user data to Redux store
        dispatch(
          loginUser({
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName,
            address: userData.address,
            phoneNumber: userData.phoneNumber,
          })
        );

        // Set loading state to false
        dispatch(setLoading(false));
        toast.success("Logged in successfully",{
          style: {
            marginTop:'80px',
          },
        });
        navigate("/");  
      } else {
        console.error("User data not found in Firestore");
      }
    } catch (error) {
      setShakeSignal((s) => s + 1);
      toast.error(error.message,{
        style: {
          marginTop:'80px',
        },
      });
    }
  };

  const onInvalid = () => {
    setShakeSignal((s) => s + 1);
  };

  if (!onlineStatus) {
    return <Offline />;
  }  
  return (
    <AuthLayout shakeSignal={shakeSignal}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <FormTitle title="Login" />
        <FormInput 
          name="email" 
          label="Email Address" 
          type="email"
          register={register("email")}
          errors={errors} 
        />

        <FormInput 
        name="password" 
        label="Password" 
        type="password" 
        register={register("password")}    
        errors={errors} />
        <FormButton buttonText="Login" />
      </form>
      <FormMessage message="Don't have an account?" linkText="Signup" link="/signup" />
    </AuthLayout>
  );
};

export default Login;
