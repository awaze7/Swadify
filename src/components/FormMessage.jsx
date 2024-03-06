import React from 'react'
import { Link } from 'react-router-dom'


const FormMessage = ({message,linkText,link}) => {
  return (
    <div className="mt-3 font-semibold text-sm text-slate-500 text-center md:text-left">
        {message}{" "}
        <Link
            className="text-red-600 hover:underline hover:underline-offset-4"
            to={link}
        >
        {linkText}
        </Link>
    </div>
  )
}

export default FormMessage
