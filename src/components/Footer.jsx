import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from 'react-icons/fa';
import { GITHUB_ACC_URL, LINKED_IN_URL } from '../utils/constants';

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FaFacebook },
  { label: 'GitHub', href: GITHUB_ACC_URL, Icon: FaGithub },
  { label: 'Instagram', href: 'https://instagram.com', Icon: FaInstagram },
  { label: 'Twitter', href: 'https://twitter.com', Icon: FaTwitter },
  { label: 'LinkedIn', href: LINKED_IN_URL, Icon: FaLinkedin },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer id="app-footer" className="mt-auto w-full bg-yellow-300 p-2.5 text-center text-xl">
      <div className="flex flex-col items-center justify-between md:flex-row">
        <p className="mb-4 flex-grow font-mono font-medium md:mb-0">
          &copy; {year} Swadify All rights reserved.
        </p>

        <ul className="mr-5 flex items-center">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <li key={label}>
              {/*
                Each icon link now carries an accessible name — they were five
                anchors whose only content was an unlabelled <svg>, so a screen
                reader announced "link" five times with nothing to distinguish
                them. Hover colour moved to CSS: it was previously driven by a
                `hoveredIcon` state value, which re-rendered the whole footer on
                every pointer move between icons.
              */}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Swadify on ${label} (opens in a new tab)`}
                className="mx-2 block rounded p-1 text-black transition-colors hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300"
              >
                <Icon size={22} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
