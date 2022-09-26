import { signIn, useSession } from "next-auth/react";
import NextImage from "next/future/image";
import NextLink from "next/link";
import { FC, ReactElement, useEffect } from "react";
import Layout from "../components/layout";
import { trpc } from "../utils/trpc";
import { NextPageWithLayout } from "./_app";

/** @todo pick from Petition itself */
interface PetitionCardProps {
  title: string;
  body: string | null;
  image?: {
    url: string;
    alt: string | null;
  };
  slug: string;
}

const PetitionCard: FC<PetitionCardProps> = ({ title, body, image, slug }) => {
  return (
    <NextLink href={`/s/${slug}`}>
      <div className="place-self-center w-full h-full max-w-sm min-h-64 rounded overflow-hidden shadow-lg cursor-pointer">
        <div className="relative h-36">
          {image && (
            <NextImage
              className="w-full object-cover"
              src={image.url}
              alt={image.alt || ""}
              fill
            />
          )}
        </div>
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2 line-clamp-2">{title}</div>
          <p className="text-gray-700 text-base line-clamp-6">{body}</p>
        </div>
      </div>
    </NextLink>
  );
};

const Me: NextPageWithLayout = () => {
  const session = useSession();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      signIn();
    }
  }, [session.status]);

  const getAllOfMineQuery = trpc.petition.getAllOfMine.useQuery(undefined, {
    enabled: session.status === "authenticated",
  });

  return (
    <main className="container mx-auto">
      <div className="h-12" />
      <div className="justify-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-16 auto-rows-fr">
        {getAllOfMineQuery.data?.map((result, i) => {
          return (
            <PetitionCard
              key={i}
              {...result.petition}
              image={result.petition.images[0]}
            />
          );
        })}
      </div>
    </main>
  );
};

Me.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Me;
