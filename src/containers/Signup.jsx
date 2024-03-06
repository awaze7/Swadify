import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth,db } from "../firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useDispatch } from "react-redux";
import { loginUser, setLoading } from "../utils/Redux/userSlice";
import { doc, setDoc } from "firebase/firestore";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { toast } from "react-toastify";
import FormImage from "../components/FormImage";
import FormTitle from "../components/FormTitle";
import { useForm } from "react-hook-form";
import FormButton from "../components/FormButton.jsx";
import FormInput from "../components/FormInput.jsx";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import FormMessage from "../components/FormMessage.jsx";

const schema = yup.object().shape({
  name : yup.string().required(),
  phone: yup
    .string()
    .required()
    .matches(/^\d{10}$/,"Phone number must be 10 digits"),
  email: yup.string().required().email(),
  address: yup.string().required(),
  password: yup
    .string()
    .required()
    .min(8)
    .max(20)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, function (value) {
      // Check which specific criteria are not met
      const hasLowercase = /[a-z]/.test(value);
      const hasUppercase = /[A-Z]/.test(value);
      const hasDigit = /\d/.test(value);

      // Create a custom error message based on the missing criteria
      let errorMessage = "Password must";

      if (!hasLowercase) {
        errorMessage += " include at least one lowercase letter";
      }

      if (!hasUppercase) {
        errorMessage +=
          (hasLowercase ? "," : "") + " include at least one uppercase letter";
      }

      if (!hasDigit) {
        errorMessage +=
          (hasLowercase || hasUppercase ? "," : "") + " include at least one digit";
      }

      if (value.length < 8) {
        errorMessage += (hasLowercase || hasUppercase || hasDigit ? "," : "") + " be at least 8 characters long";
      }

      errorMessage += ".";

      return errorMessage;
  }),
  confirmPassword: yup.string().required().oneOf([yup.ref('password'), null], 'Passwords must match'),
})



const Signup = () => {
  const { register, handleSubmit, isDirty, isValid,
    formState: { errors, isSubmitSuccessful }, reset } = useForm({
    defaultValues: {
      name: '', email: '', phone: '', address: '', password: '', confirmPassword: '', 
    },
    resolver: yupResolver(schema),
    mode: "onChange"
  });
    
  const dispatch = useDispatch();
  const onlineStatus = useOnlineStatus();
  const navigate = useNavigate();

  
  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);
  
  const onSubmit = async (data) => {
      // e.preventDefault();
      const { name, phone, email, address, password, confirmPassword } = data;

      try {
          // Create user account
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          await signInWithEmailAndPassword(auth, email, password);
          
          // Create a document in the 'users' collection with user data
          await setDoc(doc(db, 'users', user.uid), {
              displayName: name,
              email: email,
              phoneNumber: phone,
              address: address,
          });
      
          // Dispatch updated user data to Redux store
          dispatch(
              loginUser({
              uid: user.uid,
              email: user.email,
              displayName: name,
              address: address,
              phoneNumber: phone,
              })
          );
      
          // Set loading state to false
          dispatch(setLoading(false));
      
          toast.success("Signed up successfully",{
              style: {
                backgroundColor: "black",
                color: "white",
                marginTop:'80px',
              },
            });
          console.log(user);
          navigate("/");
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
  <div className="flex items-center justify-center lg:my-5 md:my-40 sm:my-10">
      <section className="flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center">
          <FormImage />
          <div className="md:w-2/5 max-w-sm">
              {/* md:w-1/3 everywhere old way */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormTitle title="Sign Up" />
              <FormInput
                  name="name"
                  label="Name"
                  register={register("name")}
                  errors={errors}
              />
              <FormInput
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  register={register("phone")}
                  errors={errors}
              />
              <FormInput
                  name="email"
                  label="Email"
                  type="email"
                  register={register("email")}
                  errors={errors}
              />
              <FormInput
                  name="address"
                  label="Address"
                  register={register("address")}
                  errors={errors}
              />
              <FormInput
                  name="password"
                  label="Password"
                  type="password"
                  register={register("password")}
                  errors={errors}
              />
              <FormInput
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  register={register("confirmPassword")}
                  errors={errors}
              />
              <FormButton buttonText="Signup" isDirty isValid/>        
          </form>
          <FormMessage message="Already have an account?" linkText="Login" link="/login" />
        </div>
      </section>
  </div>        
  );
};

export default Signup;