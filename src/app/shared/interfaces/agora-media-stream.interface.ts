export interface AgoraMediaStream extends MediaStream {
  play: (elementId) => void;
  userId: string;
  profilePicture?: string;
  isPlaying?: boolean;
  isVideoMuted?: boolean;
}

export enum AgoraMediaTypeEnum {
  VIDEO = 'video',
  AUDIO = 'audio',
  SCREENSHARE = 'screenShare'
}
