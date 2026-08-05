import Button from './Button'

const FormButton = ({ buttonText, isDirty, isValid, isSubmitting = false, pendingText }) => {
  // Login.jsx doesn't pass isDirty/isValid at all (it only makes sense for
  // Signup's longer form). With the old `disabled={!isDirty || !isValid}`,
  // both being undefined made that disabled check evaluate to true always —
  // the Login button was permanently unclickable. Only gate on these when a
  // parent actually opts in by passing them.
  const hasValidationGate = isDirty !== undefined || isValid !== undefined
  const failsValidation = hasValidationGate && (!isDirty || !isValid)

  /*
   * `isSubmitting` is a separate gate from validation, and both auth forms need
   * it: Login passes no validation props at all, so it had no disabled condition
   * whatsoever and stayed live through the whole `signInWithEmailAndPassword`
   * round-trip — every extra click fired another auth request. Signup gated on
   * isDirty/isValid, which both stay true during submission, so it allowed
   * repeat account-creation attempts.
   */
  return (
    <div className="auth-field mt-2">
      <Button
        type="submit"
        size="md"
        fullWidth
        disabled={failsValidation || isSubmitting}
        aria-busy={isSubmitting}
        className="uppercase tracking-wider"
      >
        {isSubmitting ? pendingText || 'Please wait…' : buttonText}
      </Button>
    </div>
  )
}

export default FormButton
