import { useRouteError } from "react-router-dom";

const Error = () => {
    const err = useRouteError();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
                Oops! The page you are looking for doesn't exist.
            </h1>
            <h2 className="text-lg text-gray-700 mb-6">
                Please check the URL or navigate back to the home page.
            </h2>
            <div className="border-t border-gray-300 pt-4">
                <p className="text-gray-500">Error Details:</p>
                <h3 className="text-lg font-semibold text-red-600">
                    {err.status}: {err.statusText}
                </h3>
            </div>
        </div>
    );
}

export default Error;
