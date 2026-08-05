import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";

const Contact = () => {
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-5xl rounded-lg bg-white p-5 shadow-lg sm:p-8">
      {/* h1, not h2: this is the page's top-level heading, and every other page
          starts its outline at h1. */}
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">Contact Us</h1>
      <p className="text-gray-800 mb-6 text-center">
        We at Swadify, would love to hear from you! If you have any questions, suggestions,
        or feedback, please feel free to reach out to us.
      </p>
      <p className="text-gray-800 mb-2">
        You can contact us through the following methods:
      </p>
      <ul className="mb-6 ml-6 list-disc">
        <li className="text-gray-800">
          Email:{" "}
          <a
            href="mailto:info@swadify.com"
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
          >
            info@swadify.com
          </a>
        </li>
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
