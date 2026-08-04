import React from 'react'

const FormButton = ({buttonText, isDirty, isValid}) => {
  // Login.jsx doesn't pass isDirty/isValid at all (it only makes sense for
  // Signup's longer form). With the old `disabled={!isDirty || !isValid}`,
  // both being undefined made that disabled check evaluate to true always —
  // the Login button was permanently unclickable. Only gate on these when a
  // parent actually opts in by passing them.
  const hasValidationGate = isDirty !== undefined || isValid !== undefined;
  const isDisabled = hasValidationGate && (!isDirty || !isValid);

  return (
    <div className="auth-field mt-2">
        <button
            className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-150 hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            type="submit"
            disabled={isDisabled}
        >
        {buttonText}
        </button>
    </div>
  )
}

export default FormButton
