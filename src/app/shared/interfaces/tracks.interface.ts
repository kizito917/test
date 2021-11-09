import {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalTrack,
  ILocalAudioTrack,
} from "agora-rtc-sdk-ng";

export interface LocalTracks {
  audio: IMicrophoneAudioTrack;
  audioVolume: number;
  audioId: string;
  video: ICameraVideoTrack;
  videoId: string;
  // screenTrack: any;
  screenVideoTrack: ILocalVideoTrack;
  screenAudioTrack: ILocalAudioTrack;
}
