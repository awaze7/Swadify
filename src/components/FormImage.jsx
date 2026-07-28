import React from "react";
import SwadifyImg from "url:../utils/Swadify_img.png";

const FormImage = () => {
  return (
    <div className="md:w-2/5 max-w-base sm:max-w-max sm:mx-6 sm:mt-3">
        <img
        src={SwadifyImg}
        alt="Swadify Illustration"
        className="w-full h-auto object-cover"
      />
    </div>
  )
}

export default FormImage;
//  <div className="md:w-2/5 max-w-base sm:max-w-lg">
// <img src={SwadifyImg} alt="Food image" />
// </div>