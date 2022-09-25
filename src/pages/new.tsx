import type { NextPage } from "next";
import Head from "next/head";
import type { FormEventHandler } from "react";

const NewPetition: NextPage = () => {
  const handleSubmit: FormEventHandler<HTMLFormElement> = () => {};

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
            <label>
              <span className="text-gray-700">Name Your Petition</span>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder=""
              />
            </label>
            <label>
              <span className="text-gray-700">Email Address</span>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="john@example.com"
              />
            </label>
            <div>
              <input
                type="button"
                className="text-white bg-gradient-to-tr from-blue-600 to-green-400 focus:ring-2 focus:outline-none focus:ring-blue-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 cursor-pointer"
                value="Get Started"
              />
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default NewPetition;
