import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth,db } from "../firebase.js";
import { useDispatch } from "react-redux";
import { loginUser,setLoading } from "../utils/Redux/userSlice";
import { doc, getDoc } from "firebase/firestore";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { notify } from "../utils/notificationUtils";
import { describeAuthError } from "../utils/authErrors";
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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '', password: '',
    },
    resolver: yupResolver(schema),
  });
  const dispatch = useDispatch();
  const onlineStatus = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [shakeSignal, setShakeSignal] = useState(0);

  /*
   * Return the user to whatever sent them here. Cart.jsx navigates with
   * `{ state: { from: "/checkout" } }` when an anonymous user hits Checkout;
   * before this, login always dumped them back on the home page and they had to
   * find their cart again. Only same-origin relative paths are honoured so a
   * crafted link can't turn this into an open redirect.
   */
  const redirectTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/";

  const onSubmit = async (data) => {
    try {
      const { email, password } = data;
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      /*
       * The Firestore profile is supplementary, not a precondition for being
       * logged in. The old code only dispatched loginUser() when the doc
       * existed, so an account created in Auth without a matching users/{uid}
       * document was left authenticated with Firebase but signed-out as far as
       * Redux was concerned — the header still showed "Login" and the only
       * feedback was a bare "User data not found" error.
       */
      let profile = {};
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) profile = userDoc.data();
      } catch (profileError) {
        // A failed profile read must not read as a failed login.
        console.error('Could not load profile document:', profileError);
      }

      dispatch(
        loginUser({
          uid: user.uid,
          email: user.email,
          displayName: profile.displayName || user.displayName || '',
          photoURL: user.photoURL || null,
          address: profile.address || '',
          phoneNumber: profile.phoneNumber || user.phoneNumber || '',
        })
      );

      dispatch(setLoading(false));
      notify.success("Logged in successfully", { marginTop: '80px' });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setShakeSignal((s) => s + 1);
      // Firebase surfaces things like "Firebase: Error (auth/invalid-credential)."
      // which is not a message to put in front of a customer.
      notify.error(
        describeAuthError(error, 'Something went wrong while signing you in. Please try again.'),
        { marginTop: '80px' }
      );
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
        <FormButton buttonText="Login" isSubmitting={isSubmitting} pendingText="Signing in…" />
      </form>
      <FormMessage message="Don't have an account?" linkText="Signup" link="/signup" />
    </AuthLayout>
  );
};

export default Login;
