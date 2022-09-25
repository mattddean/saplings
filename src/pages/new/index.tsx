import { useSetAtom } from "jotai";
import { signIn } from "next-auth/react";
import { ReactElement } from "react";
import { useForm } from "react-hook-form";
import CreatePetitionLayout from "../../components/create-petition-layout";
import { unauthenticatedPetitionTitleAtom } from "../../state/unauthenticated-petition";
import type { NextPageWithLayout } from "../_app";

const CreatePetitionStep1: NextPageWithLayout = () => {
  const setUnauthenticatedPetitionTitle = useSetAtom(
    unauthenticatedPetitionTitleAtom
  );
  type FormData = { title: string };
  const { register, handleSubmit } = useForm<FormData>();
  const onSubmit = handleSubmit((data) => {
    setUnauthenticatedPetitionTitle(data.title);
    return signIn();
  });

  const arrowRightSvg = (
    <svg
      aria-hidden="true"
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      ></path>
    </svg>
  );

  // TODO: have name placeholder continually be typing example names
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6">
      <div className="flex items-end gap-2">
        <label className="w-full">
          <span className="text-gray-700">Start with a catchy name</span>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
        focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder=""
            required
            {...register("title", { required: true })}
          />
        </label>
        <div>
          <button
            type="submit"
            className="text-green-400 border border-green-400 hover:bg-green-400 hover:text-white focus:ring focus:outline-none ring-indigo-200 focus:ring-opacity-50 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center"
          >
            {arrowRightSvg}
            <span className="sr-only">Icon description</span>
          </button>
        </div>
      </div>
    </form>
  );
};

CreatePetitionStep1.getLayout = (page: ReactElement) => {
  return <CreatePetitionLayout>{page}</CreatePetitionLayout>;
};

export default CreatePetitionStep1;
