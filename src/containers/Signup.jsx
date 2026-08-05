import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useDispatch } from "react-redux";
import { loginUser, setLoading } from "../utils/Redux/userSlice";
import { doc, setDoc } from "firebase/firestore";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { notify } from "../utils/notificationUtils";
import { describeAuthError } from "../utils/authErrors";
import AuthLayout from "../components/AuthLayout";
import FormTitle from "../components/FormTitle";
import { useForm } from "react-hook-form";
import FormButton from "../components/FormButton.jsx";
import FormInput from "../components/FormInput.jsx";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormMessage from "../components/FormMessage.jsx";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]+$/, "Phone number must contain only numbers")
    .matches(/^\d{10}$/, "Phone number must be 10 digits"),
  email: yup.string().required("Email is required").email("Invalid email format"),
  address: yup.string().required("Address is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters")
    .test("custom-password-rules", function (value) {
      if (!value) return true;

      const hasLowercase = /[a-z]/.test(value);
      const hasUppercase = /[A-Z]/.test(value);
      const hasDigit = /\d/.test(value);

      if (hasLowercase && hasUppercase && hasDigit && value.length >= 8) {
        return true;
      }

      let errorMessage = "Password must";
      if (!hasLowercase) errorMessage += " include at least one lowercase letter";
      if (!hasUppercase) errorMessage += (hasLowercase ? "," : "") + " include at least one uppercase letter";
      if (!hasDigit) errorMessage += (hasLowercase || hasUppercase ? "," : "") + " include at least one digit";
      if (value.length < 8) errorMessage += (hasLowercase || hasUppercase || hasDigit ? "," : "") + " be at least 8 characters long";
      errorMessage += ".";

      return this.createError({ message: errorMessage });
    }),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isDirty, isValid, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const dispatch = useDispatch();
  const onlineStatus = useOnlineStatus();
  const navigate = useNavigate();
  const [shakeSignal, setShakeSignal] = useState(0);

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (data) => {
    const { name, phone, email, address, password } = data;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // createUserWithEmailAndPassword already leaves the user signed in; the
      // extra signInWithEmailAndPassword that used to sit here was a second
      // network round-trip that added latency and could itself fail after the
      // account had been created successfully.
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        email: email,
        phoneNumber: phone,
        address: address,
      });

      dispatch(
        loginUser({
          uid: user.uid,
          email: user.email,
          displayName: name,
          address: address,
          phoneNumber: phone,
        })
      );

      dispatch(setLoading(false));

      notify.success("Signed up successfully", { marginTop: "80px" });
      navigate("/");
    } catch (error) {
      setShakeSignal((s) => s + 1);
      notify.error(
        describeAuthError(error, "Couldn't create your account. Please try again."),
        { marginTop: "80px" }
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
        <FormTitle title="Sign Up" />
        <FormInput name="name" label="Name" register={register("name")} errors={errors} />
        <FormInput name="phone" label="Phone Number" type="tel" register={register("phone")} errors={errors} />
        <FormInput name="email" label="Email" type="email" register={register("email")} errors={errors} />
        <FormInput name="address" label="Address" register={register("address")} errors={errors} />
        <FormInput name="password" label="Password" type="password" register={register("password")} errors={errors} />
        <FormInput name="confirmPassword" label="Confirm Password" type="password" register={register("confirmPassword")} errors={errors} />
        <FormButton
          buttonText="Signup"
          isDirty={isDirty}
          isValid={isValid}
          isSubmitting={isSubmitting}
          pendingText="Creating account…"
        />
      </form>
      <FormMessage message="Already have an account?" linkText="Login" link="/login" />
    </AuthLayout>
  );
};

export default Signup;