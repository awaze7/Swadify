import { Link } from "react-router-dom";

const Error = () => {

    return (
        <div>
            <section className="flex justify-center my-16">
                <div
                className="bg-cover bg-center h-96"
                style={{
                    backgroundImage: `url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')`,
                }}
                >
                <div className="text-center">
                    <h1 className="text-4xl text-gray-800">404</h1>
                    <div className="pt-60">
                    <h3 className="text-4xl text-gray-800">Looks like you're lost</h3>
                    <p className="text-2xl text-gray-600 mt-4">
                        The page you are looking for is not available!
                    </p>
                    <Link
                        to="/"
                        className="bg-green-500 text-white py-2 px-4 mt-4 rounded-md shadow hover:bg-green-600 inline-block"
                    >
                        Go to Home
                    </Link>
                    </div>
                </div>
                </div>
            </section>
        </div>
         
    );
}

export default Error;
