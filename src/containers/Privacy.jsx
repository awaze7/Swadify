import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";

const Privacy = () => {
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      <div className="rounded-lg bg-white p-6 shadow-lg sm:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-6 text-sm text-gray-500">Last updated: August 6, 2026</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Information We Collect</h2>
            <p className="mb-3 leading-relaxed">
              We collect information you provide directly to us, including:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, and delivery address</li>
              <li><strong>Order Information:</strong> Details of orders you place, including items, restaurants, and delivery preferences</li>
              <li><strong>Payment Information:</strong> Payment method details (processed securely through our payment partners)</li>
              <li><strong>Communications:</strong> Messages you send through our contact forms or support channels</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
            <p className="mb-3 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about orders, updates, and promotions</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Improve and personalize your experience with Swadify</li>
              <li>Analyze usage patterns and improve our service</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Power our Crave AI assistant to provide personalized recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Information Sharing</h2>
            <p className="mb-3 leading-relaxed">
              We share your information in the following circumstances:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>With Restaurants:</strong> Order details and delivery information to fulfill your order</li>
              <li><strong>With Service Providers:</strong> Third-party vendors who assist with payment processing, delivery, and analytics</li>
              <li><strong>For Legal Reasons:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Data Storage and Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. Your data
              is stored securely using industry-standard encryption and security protocols. However, no
              method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to collect information about your browsing
              activities and preferences. This helps us improve your experience, remember your preferences,
              and provide personalized recommendations. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Your Rights and Choices</h2>
            <p className="mb-3 leading-relaxed">
              You have the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of promotional communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@swadify.com" className="font-medium text-crave hover:underline">
                privacy@swadify.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Children's Privacy</h2>
            <p className="leading-relaxed">
              Swadify is not intended for users under the age of 13. We do not knowingly collect personal
              information from children under 13. If we become aware that we have collected such information,
              we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined
              in this policy, unless a longer retention period is required by law. Order history is retained
              to provide reorder functionality and customer support.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">9. International Data Transfers</h2>
            <p className="leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of
              residence. We ensure appropriate safeguards are in place to protect your information in
              accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">10. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by posting the new policy on this page and updating the "Last updated" date. Your continued
              use of Swadify after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please
              contact us at{' '}
              <a href="mailto:privacy@swadify.com" className="font-medium text-crave hover:underline">
                privacy@swadify.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
