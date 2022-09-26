import { useAtom } from "jotai";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { FC, useEffect, useRef } from "react";
import CreatePetitionLayout from "../components/create-petition-layout";
import Layout from "../components/layout";
import { redirectSlugAtom as redirectLinkAtom } from "../state/redirect-petition-slug";
import { unauthenticatedPetitionTitleAtom } from "../state/unauthenticated-petition";
import { trpc } from "../utils/trpc";
import { NextPageWithLayout } from "./_app";

type NextAuthProviders = Awaited<ReturnType<typeof getProviders>>;

export const getServerSideProps: GetServerSideProps<{
  providers: NextAuthProviders;
}> = async () => {
  const providers = await getProviders();
  return { props: { providers } };
};

const CreatingSaplingSpinner: FC = () => {
  return (
    <div className="flex gap-2">
      <div>Creating Sapling</div>
      <div role="status">
        <svg
          className="inline mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Creating Sapling...</span>
      </div>
    </div>
  );
};

const ProviderList: FC<{ providers: NextAuthProviders }> = ({ providers }) => {
  if (!providers) {
    // we never expect to get here
    throw new Error("Internal server error");
  }

  return (
    <>
      {Object.values(providers).map((provider) => (
        <div key={provider.name}>
          <button onClick={() => signIn(provider.id)}>
            Sign in with {provider.name}
          </button>
        </div>
      ))}
    </>
  );
};

/** Handle normal logins (redirect user to homepage after logging in). */
const NormalLogin: FC<{ providers: NextAuthProviders }> = ({ providers }) => {
  const session = useSession();
  const router = useRouter();

  // The user will be sent back to this page after logging in, so we handle that here.
  // Log the user in and redirect them to the homepage.
  useEffect(() => {
    if (session.status !== "authenticated") return;

    const asyncFn = async () => {
      // wait at least 10 seconds for router to be ready
      const waitMs = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 2000; i++) {
        await waitMs(5);
        if (router.isReady) break;
      }
      if (!router.isReady) throw new Error("Unable to redirect to petition");

      // send user to their new petition
      await router.replace("/");
    };
    asyncFn().catch((error) => {
      throw error;
    });
  }, [router, session.status]);

  return (
    <Layout>
      <ProviderList providers={providers} />
    </Layout>
  );
};

/** Handle redirect logins (redirect user to specified redirectLink after logging in). */
const RedirectLogin: FC<{
  providers: NextAuthProviders;
  redirectLink: string;
  setRedirectLink: (newVal: string | undefined) => any;
}> = ({ providers, setRedirectLink, redirectLink }) => {
  const session = useSession();
  const router = useRouter();

  // The user will be sent back to this page after logging in, so we handle that here.
  // Log the user in and redirect them to the page given in redirectLink.
  useEffect(() => {
    if (session.status !== "authenticated") return;

    const asyncFn = async () => {
      // wait at least 10 seconds for router to be ready
      const waitMs = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 2000; i++) {
        await waitMs(5);
        if (router.isReady) break;
      }
      if (!router.isReady) throw new Error("Unable to redirect to petition");

      // clean up after ourselves; this will indicate to the login page in the future that it
      // doesn't need to handle creating a petition anymore
      setRedirectLink(undefined);

      // send user to their new petition
      await router.replace(redirectLink);
    };
    asyncFn().catch((error) => {
      throw error;
    });
  }, [redirectLink, router, session.status, setRedirectLink]);

  return (
    <Layout>
      <ProviderList providers={providers} />
    </Layout>
  );
};

/**
 * Handle logins taking place as part of the petition creation process
 * (redirect user to their new petition after creating the petition and logging them in).
 */
const CreatePetitionStep2: FC<{
  providers: NextAuthProviders;
  unauthenticatedPetitionTitle: string;
  setUnauthenticatedPetitionTitle: (newVal: string | undefined) => any;
}> = ({
  providers,
  unauthenticatedPetitionTitle,
  setUnauthenticatedPetitionTitle,
}) => {
  const session = useSession();
  const router = useRouter();
  const createPetitionAndUserMutation =
    trpc.petition.createPetitionAndUser.useMutation();
  const isCreatingPetition = useRef(false);

  // The user will be sent back to this page after logging in, so we handle that here.
  // Create petition and redirect user to its page.
  useEffect(() => {
    if (session.status !== "authenticated" || isCreatingPetition.current) {
      return;
    }

    const asyncFn = async () => {
      isCreatingPetition.current = true;

      // create user and his/her new petition
      const result = await createPetitionAndUserMutation.mutateAsync({
        title: unauthenticatedPetitionTitle,
      });

      // wait at least 10 seconds for router to be ready
      const waitMs = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 2000; i++) {
        await waitMs(5);
        if (router.isReady) break;
      }
      if (!router.isReady) throw new Error("Unable to redirect to petition");

      // clean up after ourselves; this will indicate to the login page in the future that it
      // doesn't need to handle creating a petition anymore
      setUnauthenticatedPetitionTitle(undefined);

      // send user to their new petition
      await router.replace(`/s/${result.petition.slug}`);

      // it's unclear if this will run, but it doesn't matter because we're navigating away from this page
      // and all this does is inform visibility of CreatingSaplingSpinner
      isCreatingPetition.current = false;
    };
    asyncFn().catch((error) => {
      throw error;
    });
  }, [
    session.status,
    createPetitionAndUserMutation,
    router,
    unauthenticatedPetitionTitle,
    setUnauthenticatedPetitionTitle,
  ]);

  // we use this instead of createPetitionAndUserMutation.isLoading because
  // this also accounts for waiting for the router to be ready
  if (isCreatingPetition.current) {
    return <CreatingSaplingSpinner />;
  }

  return (
    <CreatePetitionLayout>
      <ProviderList providers={providers} />
    </CreatePetitionLayout>
  );
};

/**
 * It's not clear if we can have multiple login pages with NextAuth, so this page jankily two responsibilities.
 * 1. Handle normal logins.
 * 2. Handle logins taking place during the creation of a petition.
 */
const Account: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ providers }) => {
  // the truthiness of the value of this local storage atom tells us that we're part of the petition creation flow rather than handling a normal login.
  const [unauthenticatedPetitionTitle, setUnauthenticatedPetitionTitle] =
    useAtom(unauthenticatedPetitionTitleAtom);
  // the truthiness of the value of this local storage atom tells us we need to redirect to the given page when done
  const [redirectLink, setRedirectLink] = useAtom(redirectLinkAtom);

  if (unauthenticatedPetitionTitle) {
    return (
      <CreatePetitionStep2
        providers={providers}
        unauthenticatedPetitionTitle={unauthenticatedPetitionTitle}
        setUnauthenticatedPetitionTitle={setUnauthenticatedPetitionTitle}
      />
    );
  }

  if (redirectLink) {
    return (
      <RedirectLogin
        providers={providers}
        redirectLink={redirectLink}
        setRedirectLink={setRedirectLink}
      />
    );
  }

  return <NormalLogin providers={providers} />;
};

export default Account;
