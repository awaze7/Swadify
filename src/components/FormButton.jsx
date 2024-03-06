import React from 'react'

const FormButton = ({buttonText, isDirty, isValid}) => {
  return (
    <div className="text-center md:text-left">
        <button
            className="mt-1 bg-blue-600 hover:bg-blue-700 px-2 py-0.5 text-white uppercase rounded text-base tracking-wider"
            type="submit"
            disabled={!isDirty || !isValid}
        >
        {buttonText}
        </button>
    </div>
  )
}

export default FormButton
