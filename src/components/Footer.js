import React, { useState } from 'react';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from 'react-icons/fa';
import { GITHUB_ACC_URL, LINKED_IN_URL } from '../utils/constants';

const Footer = () => {
  const year = new Date().getFullYear();
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const handleIconHover = (iconName) => {
    setHoveredIcon(iconName);
  };

  const handleIconLeave = () => {
    setHoveredIcon(null);
  };

  return (
    <footer className="bg-yellow-300 text-xl p-2.5 text-center mt-auto w-full">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="flex-grow font-medium mb-4 md:mb-0">
          &copy; {year} Swadify All rights reserved.
        </p>

        <div className="flex items-center mr-5">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('facebook')}
            onMouseLeave={handleIconLeave}
          >
            <FaFacebook
              size={22}
              color={hoveredIcon === 'facebook' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href={GITHUB_ACC_URL}
            //
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('github')}
            onMouseLeave={handleIconLeave}
          >
            <FaGithub
              size={22}
              color={hoveredIcon === 'github' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('instagram')}
            onMouseLeave={handleIconLeave}
          >
            <FaInstagram
              size={22}
              color={hoveredIcon === 'instagram' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('twitter')}
            onMouseLeave={handleIconLeave}
          >
            <FaTwitter
              size={22}
              color={hoveredIcon === 'twitter' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href={LINKED_IN_URL}
            // LINKED_IN_URL = "https://www.linkedin.com/in/awazeshaikh7/";
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('linkedin')}
            onMouseLeave={handleIconLeave}
          >
            <FaLinkedin
              size={22}
              color={hoveredIcon === 'linkedin' ? '#8B5CF6' : '#000'}
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
