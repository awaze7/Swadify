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
import FormImage from "../components/FormImage";
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
      toast.error(error.message,{
        style: {
          marginTop:'80px',
        },
      });
    }
  };

  

  if (!onlineStatus) {
    return <Offline />;
  }  
  return (
    <div className="flex items-center justify-center my-auto">
    <section className="flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-14 items-center mx-5 md:mx-0 sm:my-12">
        <FormImage />
        
        <div className="md:w-2/5 max-w-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
      </div>
    </section>
  </div>
  );
};

export default Login;
