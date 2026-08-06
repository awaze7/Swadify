import { useSelector } from 'react-redux';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { FaCheckCircle } from 'react-icons/fa';

const About = () => {
  const userName = useSelector((store) => store.user?.user?.displayName || "User");
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-5xl px-4">
      <div className="rounded-lg bg-white p-6 shadow-lg sm:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">About Swadify</h1>

        <p className="mb-2 text-base text-gray-700">
          Hello <span className="font-semibold text-gray-900">{userName}</span>!
        </p>

        {/* Company Story */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Our Story</h2>
          <p className="mb-3 leading-relaxed text-gray-700">
            Swadify was born from a simple idea: connecting food lovers with the best local restaurants
            should be effortless and delightful. We believe that every meal is an opportunity to discover
            something amazing, and we're here to make that discovery seamless.
          </p>
          <p className="leading-relaxed text-gray-700">
            What started as a passion project has grown into a comprehensive platform that serves thousands
            of food enthusiasts daily. We partner with restaurants to bring you an ever-expanding selection
            of cuisines, from local favorites to exciting new discoveries.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Our Mission</h2>
          <p className="leading-relaxed text-gray-700">
            To create the most delightful food ordering experience by connecting people with quality restaurants,
            providing intelligent recommendations through our Crave AI assistant, and ensuring every order is
            delivered with care. We're committed to supporting local restaurants while making great food
            accessible to everyone.
          </p>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-crave/10">
                <span className="text-2xl font-bold text-crave">1</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Browse</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Explore restaurants, cuisines, and dishes. Use our smart search or ask Crave AI for personalized recommendations.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-crave/10">
                <span className="text-2xl font-bold text-crave">2</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Order</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Add your favorites to cart, customize as needed, and checkout securely with your preferred payment method.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-crave/10">
                <span className="text-2xl font-bold text-crave">3</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Enjoy</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Track your order in real-time and enjoy delicious food delivered right to your doorstep.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">By the Numbers</h2>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-crave">500+</div>
              <div className="text-sm text-gray-600">Partner Restaurants</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-crave">10k+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-crave">50k+</div>
              <div className="text-sm text-gray-600">Orders Delivered</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-crave">4.8★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">What Makes Us Different</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <FaCheckCircle className="mt-0.5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Crave AI Assistant:</strong> Get personalized recommendations
                and answers to all your food questions instantly.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <FaCheckCircle className="mt-0.5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Curated Selection:</strong> Every restaurant is carefully
                vetted to ensure quality and reliability.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <FaCheckCircle className="mt-0.5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Order History & Reorder:</strong> Quickly reorder your
                favorite meals with a single tap.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <FaCheckCircle className="mt-0.5 flex-shrink-0 text-green-600" />
              <span className="text-gray-700">
                <strong className="text-gray-900">Real-Time Tracking:</strong> Know exactly where your
                order is from preparation to delivery.
              </span>
            </li>
          </ul>
        </section>

        {/* Built By */}
        <section className="border-t border-gray-200 pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Built By</h2>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="text-sm text-gray-700">
              <p className="mb-1">
                Swadify is developed by <span className="font-semibold text-gray-900">Awaze Shaikh</span>,
                a BE student from Sinhgad College of Engineering passionate about creating delightful
                user experiences.
              </p>
              <p className="text-gray-600">
                Questions or feedback? Reach out at{' '}
                <a
                  href="mailto:awazeshaikh7@gmail.com"
                  className="font-medium text-crave hover:underline focus:outline-none focus-visible:underline"
                >
                  awazeshaikh7@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
