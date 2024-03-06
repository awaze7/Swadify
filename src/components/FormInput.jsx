import React from 'react'

const FormInput = ({name, label, type, register, errors}) => {
  const errorMsg=errors[name]?.message;
  const updatedErrorMsg = errorMsg ? errorMsg.replace(name, label) : null;

  return (
    <div className="mb-4">
        <input
            className="text-sm w-full px-3 py-1.5 border border-solid border-gray-400 rounded outline-none"
            type={type?type:"text"}
            {...register }
            placeholder={label}
        />
        <p className="text-red-500 text-sm">{updatedErrorMsg}</p>
    </div>
  )
}

export default FormInput;
