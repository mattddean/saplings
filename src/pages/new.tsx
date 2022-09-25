import type { NextPage } from "next";
import Head from "next/head";
import type { FormEventHandler } from "react";

const NewPetition: NextPage = () => {
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    console.debug("submitting");
    event.preventDefault();
  };

  return (
    <>
      <Head>
        <title>New Petition</title>
        <meta name="description" content="Create a new petition" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container flex flex-col items-center justify-center min-h-screen p-4 mx-auto">
        <h1 className="text-5xl md:text-[5rem] leading-none font-bold text-gray-700">
          Create{" "}
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-400">
            Sapling
          </span>
        </h1>
        <div className="h-8" />
        <div className="w-full max-w-xs">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div className="flex items-end gap-2">
              <label className="w-full">
                <span className="text-gray-700">Start with a catchy name</span>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder=""
                />
              </label>
              <div>
                <button
                  type="submit"
                  className="text-green-400 border border-green-400 hover:bg-green-400 hover:text-white focus:ring focus:outline-none ring-indigo-200 focus:ring-opacity-50 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Icon description</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default NewPetition;
