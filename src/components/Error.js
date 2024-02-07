import { useRouteError } from "react-router-dom";

const Error = () => {
    const err = useRouteError();
    console.log(err);
    return (
        <div>
            <h1>
                Oops! The page you are looking for doesn't exist.
            </h1>
            <h2>
                Please check the URL or navigate back to the home page.
            </h2>
            <h3>{err.status}: {err.statusText}</h3>
        </div>
    )
}

export default Error;