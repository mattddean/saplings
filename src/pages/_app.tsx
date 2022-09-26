import type { NextPage } from "next";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { ReactElement } from "react";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

export type NextPageWithLayout<P = Record<string, any>, IP = P> = NextPage<
  P,
  IP
> & {
  getLayout?: (page: ReactElement) => ReactElement;
};

type OurAppProps = AppProps<{ session: Session }> & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: OurAppProps) => {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <SessionProvider session={pageProps.session}>
        {getLayout(<Component {...pageProps} />)}
      </SessionProvider>
    </>
  );
};

export default trpc.withTRPC(MyApp);
