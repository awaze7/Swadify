import React from 'react';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";

const Contact = () => {
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }
  
  return (
    <div className="max-w-5xl mx-auto p-6 my-8 rounded-lg shadow-lg bg-white">
      <h2 className="text-4xl font-bold mb-4 text-center">Contact Us</h2>
      <p className="text-gray-800 mb-6 text-center">
        We at Swadify, would love to hear from you! If you have any questions, suggestions,
        or feedback, please feel free to reach out to us.
      </p>
      <p className="text-gray-800 mb-2">
        You can contact us through the following methods:
      </p>
      <ul className="list-disc ml-6 mb-6">
        <li className="text-gray-800">Email: info@swadify.com</li>
        <li className="text-gray-800">Visit our office: 123 Delicious Street, Foodville</li>
      </ul>
      <p className="text-gray-800 mb-6">
        Our customer support team is available to assist you during our business hours.
      </p>
      <p className="text-gray-800 mb-6">
        Thank you for choosing Swadify for your delicious meals!
      </p>
    </div>
  );
}

export default Contact;
