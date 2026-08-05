/**
 * Human-readable messages for Firebase Auth error codes.
 *
 * Both Login and Signup used to toast `error.message` verbatim, which produces
 * strings like "Firebase: Error (auth/invalid-credential)." — that leaks the
 * vendor name, reads as a crash, and tells the user nothing actionable.
 */
const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed':
    'Couldn’t reach the server. Check your connection and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/operation-not-allowed': 'Email sign-in is currently unavailable. Please try again later.',
};

export const describeAuthError = (error, fallback = 'Something went wrong. Please try again.') =>
  AUTH_ERROR_MESSAGES[error?.code] || fallback;

export default describeAuthError;
