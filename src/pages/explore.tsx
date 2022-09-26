import { ReactElement } from "react";
import Layout from "../components/layout";
import { NextPageWithLayout } from "./_app";

const Petition: NextPageWithLayout = () => {
  return <></>;
};

Petition.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Petition;
