import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../firebase";
import { logOut, setLoading } from "./Redux/userSlice";
import { clearChat } from "./Redux/aiChatSlice";
import { notify } from "./notificationUtils";

/**
 * One logout implementation for the whole app.
 *
 * There were three copies before (Header's mobile menu, UserDropdown and
 * Profile) and they disagreed: only UserDropdown cleared the AI chat history, so
 * logging out from the Profile page left the previous user's conversation in
 * Redux. Profile also left `user.isLoading` stuck at `true` forever, since it
 * set the flag before signing out and never reset it on the success path.
 *
 * Also clears the TanStack Query cache, otherwise the next user to log in on the
 * same browser would briefly see the previous user's cached order history.
 */
const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await auth.signOut();

      dispatch(logOut());
      dispatch(clearChat());
      // Drop every cached query so no per-user data leaks into the next session.
      queryClient.clear();

      notify.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      notify.error("Could not log you out. Please try again.");
    } finally {
      // Always settle both flags, on success and failure alike.
      dispatch(setLoading(false));
      setIsLoggingOut(false);
    }
  }, [dispatch, navigate, queryClient, isLoggingOut]);

  return { logout, isLoggingOut };
};

export default useLogout;
