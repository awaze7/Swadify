import { Link } from "react-router-dom";
import { buttonClasses } from "../components/Button";

const Error = () => {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      {/*
        The illustration was a remote dribbble GIF inside a fixed `h-96` box
        whose child used `pt-60` — the copy and the "Go to Home" link were
        pushed clean out of the container and overlapped whatever followed.
        A self-contained heading needs no third-party asset and cannot break.
      */}
      <p className="text-7xl font-black tracking-tight text-gray-200 dark:text-gray-700 sm:text-8xl">404</p>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
        Looks like you&rsquo;re lost
      </h1>
      <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
        The page you&rsquo;re looking for isn&rsquo;t available. It may have moved, or the link
        might be out of date.
      </p>

      <Link to="/" className={buttonClasses({ size: "lg", className: "mt-8" })}>
        Back to restaurants
      </Link>
    </section>
  );
};

export default Error;
