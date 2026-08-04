import React, { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const FormInput = ({name, label, type, register, errors}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorMsg = errors[name]?.message;
  const updatedErrorMsg = errorMsg ? errorMsg.replace(name, label) : null;
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : (type || 'text');

  return (
    <div className="auth-field mb-4">
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          className={`w-full rounded-xl border bg-stone-50 px-3.5 py-2.5 ${isPassword ? 'pr-10' : ''} text-sm text-stone-900 outline-none transition-colors duration-150 placeholder:text-stone-400 focus:bg-white focus:ring-2 ${
            updatedErrorMsg
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-stone-200 focus:border-[#FFC72C] focus:ring-[#FFC72C]/30'
          }`}
          type={resolvedType}
          {...register}
          placeholder={label}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
          >
            {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <p className="mt-1 min-h-[14px] text-xs font-medium text-red-500">{updatedErrorMsg}</p>
    </div>
  )
}

export default FormInput;
