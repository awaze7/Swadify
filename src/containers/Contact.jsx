import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import FormInput from "../components/FormInput";
import FormButton from "../components/FormButton";
import { notify } from "../utils/notificationUtils";
import { FaClock, FaEnvelope, FaChevronDown, FaChevronUp } from "react-icons/fa";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().required("Email is required").email("Invalid email format"),
  subject: yup.string().required("Subject is required"),
  message: yup.string().required("Message is required").min(10, "Message must be at least 10 characters"),
});

const FAQ_ITEMS = [
  {
    q: "How do I track my order?",
    a: "Once your order is placed, you can track it from your profile page. You'll see real-time updates as your order moves from confirmed to preparing, out for delivery, and finally delivered."
  },
  {
    q: "What payment methods do you accept?",
    a: "Currently, we accept Cash on Delivery (COD). We're working on adding more payment options including UPI, credit/debit cards, and digital wallets soon."
  },
  {
    q: "Can I cancel or modify my order?",
    a: "You can cancel your order before it's confirmed by the restaurant. Once preparation begins, cancellation may not be possible. Contact our support team immediately if you need help."
  },
  {
    q: "What is the Crave AI assistant?",
    a: "Crave AI is your personal food assistant that helps you discover dishes, get recommendations based on your preferences, and answer questions about menu items and restaurants."
  },
  {
    q: "How long does delivery take?",
    a: "Delivery times vary by restaurant and your location, typically ranging from 30-60 minutes. You'll see estimated delivery time before placing your order."
  },
  {
    q: "Is there a minimum order amount?",
    a: "Minimum order amounts vary by restaurant. You'll see any minimum requirements when browsing the restaurant's menu."
  },
];

const Contact = () => {
  const onlineStatus = useOnlineStatus();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, "contact_messages"), {
        ...data,
        createdAt: serverTimestamp(),
        status: "new",
      });

      notify.success("Message sent successfully! We'll get back to you soon.");
      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      notify.error("Couldn't send your message. Please try again or email us directly.");
    }
  };

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-5xl px-4">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg sm:p-10">
        <h1 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
          We'd love to hear from you! Whether you have questions, feedback, or need support,
          we're here to help.
        </p>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Send us a message</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <FormInput
                name="name"
                label="Name"
                register={register("name")}
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
                name="subject"
                label="Subject"
                register={register("subject")}
                errors={errors}
              />

              {/* Textarea for message */}
              <div className="auth-field">
                <label htmlFor="message" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-gray-400">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className={`w-full rounded-xl border bg-stone-50 dark:bg-gray-700 px-3.5 py-2.5 text-sm text-stone-900 dark:text-gray-100 outline-none transition-colors duration-150 placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 ${
                    errors.message?.message
                      ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
                      : 'border-stone-200 dark:border-gray-600 focus:border-crave focus:ring-crave/30 dark:focus:border-yellow-500 dark:focus:ring-yellow-500/20'
                  }`}
                  aria-invalid={errors.message?.message ? true : undefined}
                  aria-describedby={errors.message?.message ? "message-error" : undefined}
                  {...register("message")}
                  placeholder="Tell us how we can help..."
                />
                <p id="message-error" role="alert" className="mt-1 min-h-[14px] text-xs font-medium text-red-500">
                  {errors.message?.message}
                </p>
              </div>

              <FormButton
                buttonText="Send Message"
                isDirty={isDirty}
                isValid={isValid}
                isSubmitting={isSubmitting}
                pendingText="Sending..."
              />
            </form>
          </div>

          {/* Support Info */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Get in touch</h2>

            <div className="mb-6 space-y-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
              <div className="flex items-start gap-3">
                <FaEnvelope className="mt-1 flex-shrink-0 text-crave" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Email</h3>
                  <a
                    href="mailto:info@swadify.com"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-crave focus:outline-none focus-visible:underline"
                  >
                    info@swadify.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaClock className="mt-1 flex-shrink-0 text-crave" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Support Hours</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monday - Sunday</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">9:00 AM - 9:00 PM IST</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our customer support team typically responds within 24 hours during business hours.
              For urgent order-related issues, please include your order ID in your message.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-10">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700/30">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-crave dark:focus-visible:ring-yellow-500 focus-visible:ring-inset"
                    aria-expanded={isExpanded}
                  >
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.q}</span>
                    {isExpanded ? (
                      <FaChevronUp className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <FaChevronDown className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
