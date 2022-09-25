import type { NextPage } from "next";
import { useState } from "react";
import { trpc } from "../utils/trpc";

const CreatePetition: NextPage = () => {
  const [image, setImage] = useState<File>();
  const [error, setError] = useState<string>();

  // pre-fetch an image upload signature so that the user doesn't have to wait for this process while uploading their image
  const signatureQuery = trpc.petition.generateImageUploadSignature.useQuery();

  const uploadImage = () => {
    if (!image) {
      // ui should have prevented this
      throw new Error();
    }

    const { data } = signatureQuery;
    if (!data) {
      setError("Unable to process images at this time");
      return;
    }

    const formData = new FormData();
    formData.append("file", image);
    formData.append("cloud_name", data.cloudName);
    formData.append("api_key", data.apiKey);
    formData.append("timestamp", `${data.timestamp}`);
    formData.append("signature", data.signature);
    formData.append("folder", data.folder);

    const asyncFunc = async () => {
      const response = await fetch(data.url, {
        method: "post",
        body: formData,
      });
      return response.json();
    };
    asyncFunc().catch(setError);
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <div>
        <input type="file" onChange={(e) => setImage(e.target.files?.[0])} />
        {signatureQuery.isLoading ? (
          <button disabled>Please wait</button>
        ) : (
          <button onClick={uploadImage}>Upload</button>
        )}
      </div>
    </div>
  );
};

export default CreatePetition;
