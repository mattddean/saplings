import { ReactElement } from "react";
import Layout from "../components/layout";
import { NextPageWithLayout } from "./_app";

const Explore: NextPageWithLayout = () => {
  return <></>;
};

Explore.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Explore;
