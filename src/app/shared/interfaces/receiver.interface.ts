import { IAgoraRTCClient } from "agora-rtc-sdk-ng";

// we can also embed other details here
export interface Receiver {
  client: IAgoraRTCClient;
  isJoined: boolean;
}
