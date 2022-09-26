import { useRouter } from "next/router";
import { ReactElement, useEffect } from "react";
import Layout from "../components/layout";
import { NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/me");
  });

  return <></>;
};

Home.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Home;
