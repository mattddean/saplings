export const buildSlug = (title: string) => {
  // remove special characters
  const titleWithoutSpecialCharacters = title.replace(/[^a-zA-Z0-9 ]/g, "");
  // replace spaces with dashes
  const slug = titleWithoutSpecialCharacters.split(" ").join("-").toLowerCase();
  console.debug("slug", slug);
  return slug;
};
