import { createContext } from "react";

const UserContext = createContext({
    loggedInUser: "default name",
});

export default UserContext;