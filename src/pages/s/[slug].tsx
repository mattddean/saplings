import { DehydratedState } from "@tanstack/react-query";
import { createProxySSGHelpers } from "@trpc/react/ssg";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import { signIn, useSession } from "next-auth/react";
import NextImage from "next/future/image";
import { ReactElement } from "react";
import superjson from "superjson";
import Layout from "../../components/layout";
import EditImageOverlay from "../../components/upload-image";
import { env } from "../../env/client.mjs";
import { createContextInner } from "../../server/trpc/context";
import { appRouter } from "../../server/trpc/router";
import { trpc } from "../../utils/trpc";
import { NextPageWithLayout } from "../_app.jsx";

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

const Petition: NextPageWithLayout<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ slug }) => {
  const embeddedSignUrlMutation =
    trpc.petition.createEmbeddedSignUrl.useMutation();
  const session = useSession();

  const handleSignClick = () => {
    // The user must be logged in to sign a petition, so we send them to the login page if they're not.
    // They should be sent right back to this petition page once they're done logging in.
    if (session.status !== "authenticated") {
      signIn();
      return;
    }

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

  // a convoluted way to overlay a div on a next/future/image
  const imageArea = (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr",
        gridTemplateRows: "350px",
        gridColumnGap: "0px",
        gridRowGap: "0px",
        alignContent: "center",
        justifyContent: "center",
      }}
    >
      {mainImage && (
        <div style={{ gridArea: "1 / 1 / 2 / 2" }}>
          <div
            className="relative"
            style={{
              display: "grid",
              minWidth: "350px",
              width: "100%",
              height: "100%",
            }}
          >
            <NextImage
              className="shadow-lg rounded-lg w-100"
              src={mainImage.url}
              alt={mainImage.alt || ""}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              fill
            />
          </div>
        </div>
      )}
      {userIsAdmin && (
        /**
         * @todo allow removing image without setting a replacement
         * @todo show a loading state while uploading image
         */
        <>
          <EditImageOverlay
            petitionSlug={slug}
            className={`cursor-pointer h-full w-full rounded-lg z-10 ${
              !mainImage ? "bg-gray-200" : ""
            } hover:bg-white peer opacity-40 transition-colors`}
            style={{
              gridArea: "1 / 1 / 2 / 2",
              display: "grid",
              alignItems: "center",
            }}
            doneAddingImage={privatePetitionQuery.refetch}
          />
          <div
            className="relative text-center items-center opacity-0 peer-hover:opacity-100 transition-opacity"
            style={{
              gridArea: "1 / 1 / 2 / 2",
              display: "grid",
              minWidth: "350px",
              width: "100%",
              height: "100%",
            }}
          >
            {mainImage ? "Change Image" : "Add Image"}
          </div>
        </>
      )}
    </div>
  );

  return (
    <main className="container mx-auto">
      <div className="h-12" />
      <div className="space-y-10">
        <h1 className="text-5xl text-center">{petition.title}</h1>
        <div className="grid grid-cols-3 gap-16">
          <article className="w-full col-span-2 space-y-12">
            {imageArea}
            <div className="space-y-8 text-lg leading-loose">
              {petition.body?.split("\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>
          <div>
            <h2>Sign this Petition</h2>
            <button onClick={handleSignClick}>Sign</button>
          </div>
        </div>
      </div>
      <div className="h-12" />
    </main>
  );
};

Petition.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Petition;
