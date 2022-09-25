import { DehydratedState } from "@tanstack/react-query";
import { createProxySSGHelpers } from "@trpc/react/ssg";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { useSession } from "next-auth/react";
import NextImage from "next/future/image";
import superjson from "superjson";
import { env } from "../../env/client.mjs";
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

  // prefetch
  const result = await ssg.petition.getOne.fetch({ slug });

  if (!result) return { notFound: true };

  return {
    props: {
      // populate trpc state with prefetched data
      trpcState: ssg.dehydrate(),
      slug,
    },
    // ISR
    revalidate: 60,
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    // we'll rely entirely on ISR to statically generate our pages so that our build times do not climb with more petitions
    paths: [],
    fallback: "blocking",
  };
};

const Petition: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  slug,
}) => {
  const embeddedSignUrlMutation =
    trpc.petition.createEmbeddedSignUrl.useMutation();

  const handleSignClick = () => {
    const asyncFn = async () => {
      const result = await embeddedSignUrlMutation.mutateAsync({ slug });

      // Importing hellosign-embedded runs code that tries to access the window global variable, which is not defined on the server,
      // so we dynamically import the library on the client when it's needed. As an added bonus, we won't ship the library in this page's
      // initial JS bundle, which is good for the performance.
      const HellosignEmbedded = (await import("hellosign-embedded")).default;
      const client = new HellosignEmbedded();
      client.open(result.iframeSignUrl, {
        clientId: env.NEXT_PUBLIC_HELLOSIGN_CLIENT_ID,
        skipDomainVerification: true,
      });
    };
    asyncFn().catch((error) => {
      throw error;
    });
  };

  const publicPetitionQuery = trpc.petition.getOne.useQuery({ slug });

  const session = useSession();
  // if the user is logged in, we make this query to find out if they are an admin of this petition
  const privatePetitionQuery = trpc.petition.getOneForAdmin.useQuery(
    { slug },
    { enabled: session.status === "authenticated" }
  );
  const privatePetition = privatePetitionQuery.data?.petition;
  const userIsAdmin = !!privatePetition;

  if (publicPetitionQuery.isLoading) {
    // won't happen since we're using `fallback: "blocking"`
    return <>Loading...</>;
  }

  const publicPetition = publicPetitionQuery.data?.petition;
  if (!publicPetition) {
    throw new Error("Internal server error");
  }

  // Prefer displaying privatePetition's data to admins because it is not cached.
  // If an admin makes a change, they expect to see their update immediately rather than wait for ISR to re-generate the page.
  const petition = privatePetition || publicPetition;

  // we treat the first image as the main image
  const mainImage = petition.images[0];

  return (
    <div className="container mx-auto">
      <article>
        {mainImage && (
          <div className="relative">
            <NextImage src={mainImage.src} alt={mainImage.alt} fill />
          </div>
        )}
        {userIsAdmin && <div>Edit</div>}
        {petition.title}
      </article>
      <div>
        <h2>Sign this Sapling</h2>
        <button onClick={handleSignClick}>Sign</button>
      </div>
    </div>
  );
};

export default Petition;
