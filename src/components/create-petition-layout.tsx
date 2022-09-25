import Head from "next/head";
import type { FC, ReactNode } from "react";

export interface Props {
  children: ReactNode;
}

const CreatePetitionLayout: FC<Props> = ({ children }) => {
  return (
    <>
      <Head>
        <title>Create Sapling</title>
        <meta name="description" content="Create a new Sapling" />
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
        <div className="w-full max-w-xs">{children}</div>
      </main>
    </>
  );
};

export default CreatePetitionLayout;
