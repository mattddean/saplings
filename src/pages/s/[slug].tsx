import { DehydratedState } from "@tanstack/react-query";
import { createProxySSGHelpers } from "@trpc/react/ssg";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import NextImage from "next/future/image";
import superjson from "superjson";
import { createContextInner } from "../../server/trpc/context";
import { appRouter } from "../../server/trpc/router";
import { trpc } from "../../utils/trpc";

export const getStaticProps: GetStaticProps<{
  trpcState: DehydratedState;
  slug: string;
}> = async ({ params }) => {
  const ctx = await createContextInner({ session: null });
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx,
    transformer: superjson,
  });
  const slug = params?.slug as string;
  // prefetch `post.byId`
  const result = await ssg.petition.getOne.fetch({ slug });

  if (!result) return { notFound: true };

  return {
    props: {
      trpcState: ssg.dehydrate(),
      slug,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const Petition: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  slug,
}) => {
  const postQuery = trpc.petition.getOne.useQuery({ slug });

  if (postQuery.isLoading) {
    // won't happen since we're using `fallback: "blocking"`
    return <>Loading...</>;
  }

  const { data } = postQuery;
  if (!data) {
    throw new Error("Internal server error");
  }

  // we treat the first image as the main image
  const mainImage = data.images[0];

  return (
    <div className="container mx-auto">
      <article>
        {mainImage && (
          <div className="relative">
            <NextImage src={mainImage.src} alt={mainImage.alt} fill />
          </div>
        )}
        This is the article
      </article>
    </div>
  );
};

export default Petition;
