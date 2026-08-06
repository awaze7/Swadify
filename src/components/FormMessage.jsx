import React from 'react'
import { Link } from 'react-router-dom'


const FormMessage = ({message,linkText,link}) => {
  return (
    <div className="auth-field mt-5 text-center text-sm font-medium text-stone-500">
        {message}{" "}
        <Link
            className="rounded font-bold text-stone-900 underline decoration-crave decoration-2 underline-offset-4 transition-colors hover:text-crave focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
            to={link}
        >
        {linkText}
        </Link>
    </div>
  )
}

export default FormMessage
