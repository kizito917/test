export const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const extractYoutubeCode = (url: string) => {
  if (url) {
    var p =
      /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    if (url.match(p)) {
      return url.match(p)[1];
    }
  }
  return false;
};