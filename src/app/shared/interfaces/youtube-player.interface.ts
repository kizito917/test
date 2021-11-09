export interface YoutubePlayerVars {
  autoplay?: number;
  mute?: boolean;
  controls?: number;
  disablekb?: number;
  rel?: number;
}
export interface YoutubePlayerInterface {
  videoId: string;
  action?: number;
  suggestedQuality?: string;
  height?: number;
  width?: number;
  startSeconds?: number;
  endSeconds?: number;
  playerVars?: YoutubePlayerVars;
}
