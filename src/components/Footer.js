import React from 'react';
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-yellow-500 text-xl shadow-lg p-4 text-center mt-auto w-full flex flex-row">
      <p className="flex-grow font-medium">&copy; 2024 Swadify All rights reserved.</p>

      <div className="flex items-center">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="mx-2">
          <FaFacebook size={24} color="#000" />
        </a>
        <a href="https://github.com/awaze7" target="_blank" rel="noopener noreferrer" className="mx-2">
          <FaGithub size={24} color="#000" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mx-2">
          <FaInstagram size={24} color="#000" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="mx-2">
          <FaTwitter size={24} color="#000" />
        </a>
        <a href="https://www.linkedin.com/in/awazeshaikh7/" target="_blank" rel="noopener noreferrer" className="mx-2">
          <FaLinkedin size={24} color="#000" />
        </a>
      </div>

    </footer>
  );
};

export default Footer;
