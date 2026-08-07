import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from 'react-icons/fa';
import { GITHUB_ACC_URL, LINKED_IN_URL } from '../utils/constants';

const SOCIAL_LINKS = [
  { label: 'GitHub', href: GITHUB_ACC_URL, Icon: FaGithub },
  { label: 'LinkedIn', href: LINKED_IN_URL, Icon: FaLinkedin },
  { label: 'Instagram', href: 'https://www.instagram.com/', Icon: FaInstagram },
  { label: 'Twitter', href: 'https://twitter.com/', Icon: FaTwitter },
];

const NAV_SECTIONS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Support', to: '/contact' },
      { label: 'How It Works', to: '/about#how-it-works' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer id="app-footer" className="mt-auto w-full bg-gray-900 dark:bg-gray-950 dark:border-t dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top: brand + nav columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              to="/"
              className="inline-block text-xl font-extrabold tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Swadify
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
              Discover and order delicious meals from restaurants near you.
            </p>
            {/* Social row */}
            <ul className="mt-4 flex items-center gap-1">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Swadify on ${label} (opens in a new tab)`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-crave"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav columns */}
          {NAV_SECTIONS.map(({ heading, links }) => (
            <div key={heading}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {heading}
              </h2>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-gray-400 transition-colors hover:text-white focus:outline-none focus-visible:underline focus-visible:decoration-crave"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {year} Swadify. All rights reserved.
          </p>
          <nav aria-label="Footer legal links" className="flex gap-4">
            <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-300 focus:outline-none focus-visible:underline">
              Terms
            </Link>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-300 focus:outline-none focus-visible:underline">
              Privacy
            </Link>
            <Link to="/contact" className="text-xs text-gray-500 hover:text-gray-300 focus:outline-none focus-visible:underline">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
