import React from 'react';
const Offline = () => {
  return (
        <div className="my-auto text-center">
          <div className="pt-20">
            <h3 className="text-4xl text-gray-800">Oops! You're Offline</h3>
            <p className="text-2xl text-gray-600 mt-4">
              Please check your internet connection and try again.
            </p>
          </div>
        </div>
  );
};

export default Offline;
