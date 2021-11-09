import { LocalTracks } from "./tracks.interface";
import { IAgoraRTCClient } from "agora-rtc-sdk-ng";

// we can also embed other details here
export interface Publisher {
  tracks: LocalTracks;
  client: IAgoraRTCClient;
  screenClient: IAgoraRTCClient;
  isJoined: boolean;
  isScreenJoined: boolean;
}
