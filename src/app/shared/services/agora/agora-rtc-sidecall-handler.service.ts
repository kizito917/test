import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { EventService } from "..";
import { SideCallEnum } from "../../enums";
import { AuthService } from "../auth/auth.service";
import { AgoraRtcService } from "./agora-rtc.service";

@Injectable({
  providedIn: "root",
})
export class AgoraRtcSidecallHandlerService {
  isVideo: boolean = false;
  isAudio: boolean = false;

  isPublish: boolean = false;

  public remoteStreams = [];
  public eventParticipants = [];

  public currentReciever = null;
  public currentOnAirRemoteUserVolume = 50;
  public sidecallRoom = null;
  public isRoomInProgress: boolean = false;

  private updateRemoteUsers = new BehaviorSubject<any>("");
  subscrtiptionUpdateRemoteUsers = this.updateRemoteUsers.asObservable();

  private localStreamPublished = new BehaviorSubject<any>("");
  castLocalStreamPublished = this.localStreamPublished.asObservable();

  private sidecallRoomStart = new BehaviorSubject<any>("");
  castSidecallRoomStart = this.sidecallRoomStart.asObservable();

  private agoraRTC = null;
  private channelId = null;

  isMicMuted = false; //  if user has muted their Mic
  isCameraMuted = false; // if user has muted their Camera
  isVideoStreamInProgress: boolean = false;
  isAudioStreamInProgress: boolean = false;
  selectedVideoDevice = {
    deviceId: "",
    label: "",
  };
  selectedAudioDevice = {
    deviceId: "",
    label: "",
  };

  constructor(
    private _httpService: AuthService,
    private eventService: EventService
  ) {
    this.agoraRTC = new AgoraRtcService();
  }

  init(autoPublish, userId, channelId) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.agoraRTC.publisher.client) {
          resolve(true);
        }
        this.channelId = channelId;
        await this.agoraRTC.initSession("publisher", "rtc");
        this.subscribeEvents();
        await this.joinChannel(userId);
        await this.agoraRTC.createBothTracks(
          this.selectedVideoDevice.deviceId,
          this.selectedAudioDevice.deviceId
        );
        const streamType = this.getStreamTypeToPublish();
        if (autoPublish) {
          await this.publishLocalStream();
        }
        this.isVideo = true;
        this.isAudio = true;
        const localstream = {
          uid: this.agoraRTC.publisher.client?.uid,
          audioTrack: this.agoraRTC.publisher.tracks?.audio,
          videoTrack:
            streamType !== "audio"
              ? this.agoraRTC.publisher.tracks?.video
              : null,
        };

        this.addLocalStream(localstream);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  private subscribeEvents = () => {
    this.agoraRTC._agora.subscribe((event) => {
      const { type, user, mediaType = "video" } = event;
      if (type === "user-published") {
        console.log(event, "user published event in sidecall service");
        this.addRemoteStream(user, mediaType);
      }
      if (type === "user-unpublished") {
        console.log("this user unpublished", event);
        this.handleToggleRemoteStream(user, mediaType);
      }
      if (type === "user-left") {
        console.log("this user lefta ", event);
        this.removeRemoteStream(user);
      }
      if (type === "user-joined") {
        console.log(
          "this user joined ",
          this.agoraRTC.publisher.client.remoteUsers
        );
        // add remote user if he has muted himself
        this.agoraRTC.publisher.client.remoteUsers.map((remoteUser) => {
          this.addRemoteStream({ uid: remoteUser.uid }, null);
        });
      }
    });
  };

  joinChannel = async (userId) => {
    // get the token
    const rtcToken = null; //await this.getToken(userId)
    return new Promise(async (resolve, reject) => {
      if (
        !this.agoraRTC.publisher.isJoined &&
        !this.agoraRTC.isChannelJoining
      ) {
        try {
          const id = await this.agoraRTC.join("", {
            user_id: userId,
            activeChannelId: this.channelId,
            rtcToken,
          });
          resolve(true);
        } catch (err) {
          return reject(err);
        }
      } else {
        return resolve(true);
      }
    });
  };

  publishLocalStream() {
    const streamType = this.getStreamTypeToPublish();
    return new Promise(async (resolve, reject) => {
      if (this.isPublish) resolve(true);
      try {
        await this.agoraRTC.publish(streamType);
        this.isPublish = true;
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  async leaveChannel() {
    // if(this.isVideo) {
    //   await this.agoraRTC.publisher.tracks.video.stop();
    //   await this.agoraRTC.publisher.tracks.video.close();
    // }
    // if(this.isAudio) {
    //   await this.agoraRTC.publisher.tracks.audio.stop();
    //   await this.agoraRTC.publisher.tracks.audio.close();
    // }

    if (this.agoraRTC.publisher.isJoined) {
      await this.agoraRTC.publisher.client.leave();
      this.agoraRTC.publisher.isJoined = false;
      this.agoraRTC.publisher.client = null;
    }
    await this.stopLocalStream();
    this.isPublish = false;
    this.remoteStreams = [];
    this.localStreamPublished.next(null);
  }

  public playLocalStream = async (elementId) => {
    console.log(this.agoraRTC.publisher.tracks);
    if (this.agoraRTC.publisher.tracks?.video) {
      await this.agoraRTC.publisher.tracks.video.play(elementId);
    }
  };

  public stopLocalStream = async () => {
    if (this.agoraRTC.publisher.tracks?.video) {
      await this.agoraRTC.publisher.tracks?.video.stop();
      await this.agoraRTC.publisher.tracks?.video.close();
      this.agoraRTC.publisher.tracks.video = null;
    }
    if (this.agoraRTC.publisher.tracks?.audio) {
      await this.agoraRTC.publisher.tracks.audio.stop();
      await this.agoraRTC.publisher.tracks.audio.close();
      this.agoraRTC.publisher.tracks.audio = null;
    }
  };

  // public handleRemoteUsers = () => {
  //   this.remoteStreams = Array.from(this.agoraRTC.publisher.client.remoteUsers);
  //   this.updateRemoteUsers.next('');
  // }

  public addRemoteStream = (user, media = "video") => {
    let isRemoteUser = this.remoteStreams.find((item) => item.uid == user.uid);
    if (!isRemoteUser) {
      const participant = this.eventParticipants.find(
        (participant) => participant.user.userId === user.uid
      );
      const stream = {
        uid: user.uid,
        isModerator: false,
        videoTrack: null,
        audioTrack: null,
        displayName: participant ? participant.user.displayName : "",
        profile_picture: participant
          ? participant.user?.profilePicture
            ? participant.user?.profilePicture
            : "/assets/image/user.svg"
          : "/assets/image/user.svg",
      };
      this.remoteStreams.push(stream);
    }

    if (media === "video") {
      this.remoteStreams.forEach((stream) => {
        if (stream.uid == user.uid) {
          stream.videoTrack = user.videoTrack;
        }
      });
    }
    if (media === "audio") {
      this.remoteStreams.forEach((stream) => {
        if (stream.uid == user.uid) {
          stream.audioTrack = user.audioTrack;
        }
      });
    }
    this.updateRemoteUsers.next("");
  };

  public handleToggleRemoteStream = (user, media = "video") => {
    this.remoteStreams.forEach((stream) => {
      if (stream.uid == user.uid) {
        if (media === "video") {
          stream.videoTrack = user.videoTrack;
        }
        if (media === "audio") {
          stream.audioTrack = user.audioTrack;
        }
      }
    });

    this.updateRemoteUsers.next("");
  };

  public removeRemoteStream = (user) => {
    this.remoteStreams = this.remoteStreams.filter(
      (stream) => stream.uid != user.uid
    );
    this.updateRemoteUsers.next("");
    if (!this.remoteStreams.length) {
      setTimeout(() => {
        // if still there is no remote streams then end the call
        this.endSideCall();
      }, 5000);
    }
  };

  public addLocalStream = (localstream) => {
    const participant = this.eventParticipants.find(
      (participant) => participant.user.userId === localstream.uid
    );
    const args = {
      isModerator: participant?.isModerator,
      displayName: participant ? participant.user.displayName : "",
      profile_picture: participant
        ? participant.user?.profilePicture
          ? participant.user?.profilePicture
          : "/assets/image/user.svg"
        : "/assets/image/user.svg",
    };
    const stream = { ...localstream, ...args };
    this.localStreamPublished.next(stream);
  };

  // public toggleCamera = (flag: boolean = false) => {
  //   return new Promise( async (resolve, reject) => {
  //     if (this.agoraRTC.publisher.tracks?.video) {
  //       await this.agoraRTC.publisher.tracks.video.setEnabled(flag);
  //       this.isVideo = !this.isVideo;
  //       resolve(true);
  //     }
  //     resolve(true);
  //   });
  // }

  public toggleCamera = async (flag = this.isCameraMuted) => {
    if (this.agoraRTC.publisher.tracks?.video) {
      this.isVideoStreamInProgress = true;
      await this.agoraRTC.publisher.tracks.video.setEnabled(flag);
      this.isCameraMuted = !flag;
      this.isVideoStreamInProgress = false;
    }
  };
  public toggleMic = async (flag = this.isMicMuted) => {
    if (this.agoraRTC.publisher.tracks?.audio) {
      this.isAudioStreamInProgress = true;
      await this.agoraRTC.publisher.tracks.audio.setEnabled(flag);
      this.isMicMuted = !flag;
      this.isAudioStreamInProgress = false;
    }
  };

  public initiateSidecall(room, receiver) {
    this.sidecallRoom = room;
    this.currentReciever = receiver;
    this.sidecallRoomStart.next({ action: "room_start" });
  }

  public resetReceiver() {
    this.currentReciever = null;
  }

  public extandSidecall(room) {
    this.sidecallRoom = room;
    this.sidecallRoomStart.next({ action: "room_extand" });
  }

  public endSideCall() {
    this.sidecallRoom = null;
    this.currentReciever = null;
    this.isRoomInProgress = false;
    this.sidecallRoomStart.next({ action: "room_end" });
    this.localStreamPublished.next(null);
  }

  getToken(userId) {
    return new Promise((res, rej) => {
      this._httpService
        .getAgoraSideCallToken(this.sidecallRoom.sidechatCallId, userId)
        .then((token) => {
          return res(token);
        })
        .catch((err) => rej(err));
      // return res(
      //   "006185c89bc57c64a6ebfc72f3450bc5d86IADDvxIB/ayouYWrEK9c9I/kuMn0Y1Hn89FeH5v1y7T2Pgx+f9gAAAAAEAB33sfLQ7anYAEAAQBDtqdg"
      // );
    });
  }

  isVideoTrackExist() {
    return this.agoraRTC.publisher.tracks?.video;
  }

  isAudioTrackExist() {
    return this.agoraRTC.publisher.tracks?.audio;
  }

  getStreamTypeToPublish() {
    let streamType = "";

    // check which type of call is this..
    if (this.sidecallRoom.callType === SideCallEnum.CALLTYPE_AUDIO) {
      streamType = "audio";
    }
    return streamType;
  }

  leaveSideCallOnPageReload(sidechatCallId) {
    this.eventService
      .endSideChatCall({
        sidechat_call_id: sidechatCallId,
      })
      .subscribe((response: any) => {});
  }

  isUserJoined() {
    return this.agoraRTC.publisher.isJoined;
  }

  // setRemoteStreamVolume(mediaVolume) {
  //   this.remoteStreams.forEach((stream) => {
  //     stream?.audioTrack?.setVolume(mediaVolume);
  //   });
  //   // this.updateRemoteUsers.next("");
  // }
  setOnAirUserVolume(mediaVolume) {
    this.currentOnAirRemoteUserVolume = mediaVolume;
  }
  async applyMediaDeviceChange() {
    if (this.selectedVideoDevice.deviceId)
      await this.agoraRTC.switchVideoDevice(this.selectedVideoDevice.deviceId);
    if (this.selectedAudioDevice.deviceId)
      await this.agoraRTC.switchAudioDevice(this.selectedAudioDevice.deviceId);
  }
}
