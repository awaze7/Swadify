import React, { useState } from 'react';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from 'react-icons/fa';

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
    <footer className="bg-yellow-300 text-xl shadow-lg p-4 text-center mt-auto w-full">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="flex-grow font-medium mb-4 md:mb-0">
          &copy; {year} Swadify All rights reserved.
        </p>

        <div className="flex items-center">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('facebook')}
            onMouseLeave={handleIconLeave}
          >
            <FaFacebook
              size={24}
              color={hoveredIcon === 'facebook' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href="https://github.com/awaze7"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('github')}
            onMouseLeave={handleIconLeave}
          >
            <FaGithub
              size={24}
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
              size={24}
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
              size={24}
              color={hoveredIcon === 'twitter' ? '#8B5CF6' : '#000'}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/awazeshaikh7/"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
            onMouseEnter={() => handleIconHover('linkedin')}
            onMouseLeave={handleIconLeave}
          >
            <FaLinkedin
              size={24}
              color={hoveredIcon === 'linkedin' ? '#8B5CF6' : '#000'}
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
