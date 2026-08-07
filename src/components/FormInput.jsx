import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const FormInput = ({ name, label, type, register, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorMsg = errors[name]?.message;
  const updatedErrorMsg = errorMsg ? errorMsg.replace(name, label) : null;
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : (type || 'text');
  const errorId = `${name}-error`;

  return (
    <div className="auth-field mb-4">
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          className={`w-full rounded-xl border bg-stone-50 dark:bg-gray-700 px-3.5 py-2.5 ${isPassword ? 'pr-10' : ''} text-sm text-stone-900 dark:text-gray-100 outline-none transition-colors duration-150 placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 ${
            updatedErrorMsg
              ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
              : 'border-stone-200 dark:border-gray-600 focus:border-crave focus:ring-crave/30 dark:focus:border-yellow-500 dark:focus:ring-yellow-500/20'
          }`}
          type={resolvedType}
          // Ties the validation message to the field, so a screen reader reads
          // "Email — Please enter a valid email" instead of leaving the error
          // stranded as unassociated text below the input.
          aria-invalid={updatedErrorMsg ? true : undefined}
          aria-describedby={updatedErrorMsg ? errorId : undefined}
          {...register}
          placeholder={label}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            // No tabIndex={-1}: the reveal toggle is a real control and was
            // unreachable by keyboard, so anyone not using a mouse had no way
            // to check what they had typed.
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            // Sized as a real target rather than shrink-wrapping the 14px icon,
            // which gave a ~14px tap area. The input reserves pr-10 for it, so
            // the box grows inward around the icon without shifting the glyph.
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 dark:text-gray-500 transition-colors hover:text-stone-700 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-crave dark:focus-visible:ring-yellow-500"
          >
            {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <p id={errorId} role="alert" className="mt-1 min-h-[14px] text-xs font-medium text-red-500">
        {updatedErrorMsg}
      </p>
    </div>
  )
}

export default FormInput;
