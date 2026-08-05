import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { loginUser, logOut, setLoading } from "./Redux/userSlice";

/**
 * Keeps Redux in sync with the Firebase auth session.
 *
 * Previously nothing subscribed to `onAuthStateChanged`: Redux was only ever
 * populated by the Login/Signup submit handlers. Firebase persists the session
 * across reloads, so after a refresh the user was still authenticated to Firebase
 * while Redux reported `user: null`. That surfaced as the header falling back to
 * "Login", and /profile and /checkout both rendering their "Please Log In"
 * screens for someone who was in fact signed in.
 *
 * Mounted once at the app root.
 */
const useAuthSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) {
          dispatch(logOut());
          dispatch(setLoading(false));
        }
        return;
      }

      // Auth-only fields are available immediately; the profile fields
      // (displayName/address/phoneNumber) live in the users/{uid} document.
      const baseUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || "",
        displayName: firebaseUser.displayName || "",
      };

      try {
        const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
        if (cancelled) return;

        if (snapshot.exists()) {
          const profile = snapshot.data();
          dispatch(
            loginUser({
              ...baseUser,
              displayName: profile.displayName || baseUser.displayName,
              address: profile.address || "",
              phoneNumber: profile.phoneNumber || "",
            })
          );
        } else {
          // Authenticated but no profile document. Still a valid session — the
          // user just has not completed profile setup, so sign them in with
          // whatever auth gave us rather than locking them out.
          dispatch(loginUser(baseUser));
        }
      } catch (error) {
        if (cancelled) return;
        // A failed profile read must not invalidate the session; degrade to the
        // auth-only user instead of appearing logged out.
        console.warn("Could not load user profile document:", error?.code || error?.message);
        dispatch(loginUser(baseUser));
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [dispatch]);
};

export default useAuthSync;
