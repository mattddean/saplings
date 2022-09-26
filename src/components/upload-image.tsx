import { CSSProperties, FC, useRef, useState } from "react";
import { trpc } from "../utils/trpc";

/** An overlay designed to be placed over the main image such that it can be edited by the admin of the petition */
const EditImageOverlay: FC<{
  className?: string;
  style?: CSSProperties;
  petitionSlug: string;
  doneAddingImage?: () => any;
}> = ({ className, style, petitionSlug, doneAddingImage }) => {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  // pre-fetch an image upload signature so that the user doesn't have to wait for this process while uploading their image
  const signatureQuery = trpc.petition.generateImageUploadSignature.useQuery();
  const createImageMutation = trpc.petition.linkImage.useMutation();

  const uploadImage = (image: File | undefined) => {
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
      const result = (await response.json()) as {
        asset_id: string;
        secure_url: string;
        url: string;
      };
      await createImageMutation.mutateAsync({
        cloudinaryAssetId: result.asset_id,
        cloudinarySecureUrl: result.secure_url,
        cloudinaryUrl: result.url,
        slug: petitionSlug,
      });
      if (doneAddingImage) doneAddingImage();
    };
    asyncFunc().catch((error) => {
      throw error;
    });
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (signatureQuery.isLoading) return null;

  // The input is the true file input.
  // The button is a fake one that clicks the real one when clicked.
  return (
    <>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        onChange={(e) => uploadImage(e.target.files?.[0])}
      />
      <div
        className={className}
        style={style}
        onClick={() => inputRef.current?.click()}
      ></div>
    </>
  );
};

export default EditImageOverlay;
