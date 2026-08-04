import React from 'react'
import { Link } from 'react-router-dom'


const FormMessage = ({message,linkText,link}) => {
  return (
    <div className="auth-field mt-5 text-center text-sm font-medium text-stone-500">
        {message}{" "}
        <Link
            className="font-bold text-stone-900 underline decoration-[#FFC72C] decoration-2 underline-offset-4 transition-colors hover:text-[#FFC72C]"
            to={link}
        >
        {linkText}
        </Link>
    </div>
  )
}

export default FormMessage
