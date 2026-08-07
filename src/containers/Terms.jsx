import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";

const Terms = () => {
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg sm:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">Terms of Service</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Last updated: August 6, 2026</p>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Swadify, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Use of Service</h2>
            <p className="mb-3 leading-relaxed">
              Swadify provides a platform to discover and order food from partner restaurants. You agree to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Provide accurate information when creating an account and placing orders</li>
              <li>Keep your account credentials secure and confidential</li>
              <li>Not use the service for any unlawful or fraudulent purpose</li>
              <li>Not interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Orders and Payment</h2>
            <p className="mb-3 leading-relaxed">
              When you place an order through Swadify:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>All orders are subject to acceptance by the restaurant</li>
              <li>Prices and availability are subject to change without notice</li>
              <li>You are responsible for providing accurate delivery information</li>
              <li>Payment is due at the time of delivery for Cash on Delivery orders</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Cancellation and Refunds</h2>
            <p className="leading-relaxed">
              Order cancellation is subject to the restaurant's policy. Once preparation has begun,
              cancellation may not be possible. Refunds for cancelled orders will be processed according
              to the payment method used. Contact our support team for assistance with cancellations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Delivery</h2>
            <p className="leading-relaxed">
              Delivery times are estimates and may vary due to factors beyond our control including
              weather, traffic, and restaurant preparation time. Swadify is not liable for delays in delivery.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">6. User Content</h2>
            <p className="leading-relaxed">
              By submitting reviews, ratings, or other content to Swadify, you grant us a non-exclusive,
              worldwide license to use, reproduce, and display such content in connection with the service.
              You retain all ownership rights to your content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content on Swadify, including text, graphics, logos, and software, is the property of
              Swadify or its licensors and is protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Swadify acts as an intermediary between you and restaurants. We are not responsible for the
              quality, safety, or preparation of food. To the maximum extent permitted by law, Swadify
              shall not be liable for any indirect, incidental, or consequential damages arising from
              your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Privacy</h2>
            <p className="leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy to understand how we
              collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">10. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective
              immediately upon posting. Your continued use of Swadify after changes are posted constitutes
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">11. Contact</h2>
            <p className="leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:info@swadify.com" className="font-medium text-crave hover:underline">
                info@swadify.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
