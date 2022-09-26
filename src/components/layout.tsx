import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import NextLink from "next/link";
import type { FC, ReactNode } from "react";

export interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const session = useSession();

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        ></meta>
      </Head>

      <nav className="flex items-center justify-between flex-wrap bg-teal-600 p-6">
        <NextLink href="/">
          <div className="flex items-center flex-shrink-0 text-white mr-6 font-semibold text-xl tracking-tight cursor-pointer">
            Saplings
          </div>
        </NextLink>
        <div className="w-full block flex-grow md:flex md:items-center md:w-auto">
          <div className="text-sm md:flex-grow">
            <NextLink href="/me">
              <div className="block mt-4 md:inline-block md:mt-0 text-teal-100 hover:text-white mr-4 cursor-pointer">
                My Petitions
              </div>
            </NextLink>
          </div>
          <NextLink href="/new">
            <div className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-600 hover:bg-white mt-4 mr-4 md:mt-0 cursor-pointer">
              Create
            </div>
          </NextLink>
          {session.data ? (
            <div
              onClick={() => signOut()}
              className="inline-block text-sm mt-4 md:mt-0 text-teal-100 hover:text-white cursor-pointer"
            >
              Logout
            </div>
          ) : (
            <div
              onClick={() => signIn()}
              className="inline-block text-sm mt-4 md:mt-0 text-teal-100 hover:text-white cursor-pointer"
            >
              Login
            </div>
          )}
        </div>
      </nav>

      {children}
    </>
  );
};

export default Layout;
