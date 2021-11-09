import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AgoraRtcService } from "./agora-rtc.service";
import {
  AgoraMediaStream,
  AgoraRtcSidecallHandlerService,
  AuthService,
  BroadcastStreamingContent,
  getUserFromLocalStorage,
  timeout,
} from "src/app/shared";

import { LiveQandAState } from "src/app/shared/enums/live-qanda-state.enum";
import { RoleEnum, SideCallEnum } from "../../enums";
import { ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({
  providedIn: "root",
})
export class AgoraRtcStreamHandlerService {
  timeoutRef: any;
  updateMediaTimer: any;
  handlerRole: number;
  eventParticipants = [];
  activeEventId: string;
  activeEventState: BroadcastStreamingContent = { event_id: "" };
  userDetails = getUserFromLocalStorage();
  remoteUsers = {};
  mediaDataForView = [];

  //Full Screen / Exit Full Screen
  isFullScreenActive: boolean = false;

  // camera and audio configuration

  audioDevices = [];
  selectedAudioDevice = {
    deviceId: "",
    label: "",
  };
  videoDevices = [];
  selectedVideoDevice = {
    deviceId: "",
    label: "",
  };

  isVideoConfigurationTestingInProgress = false;
  isCameraMicSettingsDontAskMeAgainChecked = false;
  // hasAllPermissions = true;

  // localStream: MediaStream;
  // screenSharelocalStream: MediaStream;
  videoStreams = [];
  // isBroadcasting = false;
  isAudioEnabled = false; // if the stream contains the audio tracks
  isScreenShareEnabled = false;
  isVideoCall = false;
  isVideoEnabled = false; // if the stream contains the video tracks
  isMicMuted = false; //  if user has muted their Mic
  isCameraMuted = false; // if user has muted their Camera
  isScreenShareMuted = true; //

  isVideoPublished = false;
  isAudioPublished = false;
  isScreenSharePublished = false;

  handleNetwork: any;
  volumeHandler: any;

  trackRemoteUsersInfoUpdates = {};

  isVideoStreamInProgress: boolean = false;
  isAudioStreamInProgress: boolean = false;
  isHoldState: boolean = false;
  isSelectedInHoldState: boolean = false;
  constructor(
    private agoraRTC: AgoraRtcService,
    private _httpService: AuthService,
    private sidecallService: AgoraRtcSidecallHandlerService,
    private localStorageService: LocalStorageService
  ) {
    this.isCameraMuted =
      this.localStorageService.getItem("cameraMuted", "false") === "true"
        ? true
        : false;
    this.isMicMuted =
      this.localStorageService.getItem("micMuted", "false") === "true"
        ? true
        : false;
    // register for client events
    this.registerAgoraEvents();
  }

  private updateRemoteUser = new BehaviorSubject<any>("");
  castUpdateRemoteUser = this.updateRemoteUser.asObservable();

  private streamPublished = new BehaviorSubject<any>("");
  castLocalStream = this.streamPublished.asObservable();

  private fullScreenHandler = new BehaviorSubject<any>("");
  castFullScreenHandler = this.fullScreenHandler.asObservable();

  private speakingVolume = new BehaviorSubject<any>("");
  castSpeakingVolume = this.speakingVolume.asObservable();

  private mediaDevices = new BehaviorSubject<any>("");
  castMediaDevices = this.mediaDevices.asObservable();

  private screenShare = new BehaviorSubject<any>("");
  castScreenShare = this.screenShare.asObservable();

  private triggerLiveStreamAction = new BehaviorSubject<any>("");
  castTriggerLiveStreamAction = this.triggerLiveStreamAction.asObservable();

  private handleAutoPlayFailed = new BehaviorSubject<any>("");
  castHandleAutoPlayFailed = this.handleAutoPlayFailed.asObservable();

  private liveMediaStateUpdate = new BehaviorSubject<any>("");
  castLiveMediaStateUpdate = this.liveMediaStateUpdate.asObservable();

  private liveMediaStateUpdateBySideCall = new BehaviorSubject<any>("");
  castLiveMediaStateUpdateBySideCall =
    this.liveMediaStateUpdateBySideCall.asObservable();

  private callUserSelected = new BehaviorSubject<any>("");
  castCallUserSelected = this.callUserSelected.asObservable();

  public publishedLocalStream = (localStream) => {
    this.streamPublished.next(localStream);
  };

  public emitSpeakingVolume = (speakignVolume: number) => {
    this.speakingVolume.next(speakignVolume);
  };

  public initializeAgoraClient = async (role = "publisher") => {
    // prepare empty media streams if
    // this.prepareEmptyMediaStreams();
    // Getting agora rtc and screen share token
    await this.handlingChannelToken();

    if (this.agoraRTC.publisher.client) return;

    // register for client events
    // await this.registerAgoraEvents();

    // init client
    await this.agoraRTC.initSession(role);

    // select default audio/video device and create tracks
    await this.getSystemInfo();

    if (
      this.userDetails.screenShareToken &&
      this.agoraRTC.clientRole !== "audience"
    ) {
      // join screen track
      await this.agoraRTC.joinForScreen(this.userDetails);
    }

    if (this.agoraRTC.clientRole === "audience") {
      // set the timer of 1 min and if there is no remote stream in 1 min, siliently leave the agora channel
      this.handleBGChannelLeave();
    }
  };

  private prepareEmptyMediaStreams() {
    this.eventParticipants.map((participant) => {
      if (
        participant.liveQandAState === LiveQandAState.onAir ||
        (participant.isModerator &&
          this.activeEventState.data?.moderator_active_mode === "video" &&
          this.activeEventState.data?.contentType === "agora")
      ) {
        this.handleAddRemoteUser({
          user: {
            uid: participant.user.userId,
          },
          type: "video",
        });
      }
    });
  }

  private async handlingChannelToken() {
    // Getting agora rtc and screen share token
    if (this.activeEventId) {
      const rtcToken = await this.getToken(
        this.activeEventId,
        this.userDetails.user_id
      );
      this.userDetails.rtcToken = null; //rtcToken.toString() || "";
      if (this.agoraRTC.clientRole !== "audience") {
        const screenShareToken = await this.getToken(
          this.activeEventId,
          `${this.userDetails.user_id}s`
        );
        this.userDetails.screenShareToken = null; //screenShareToken.toString() || "";
        this.userDetails.screen_id = `${this.userDetails.user_id}s`;
      }
      this.userDetails.activeChannelId = this.activeEventId;
    }
  }

  private registerAgoraEvents = () => {
    this.agoraRTC._agora.subscribe((event) => {
      if (event.type == "user-published") {
        console.log(event, "this agora event subscribed!");
        this.handleAddRemoteUser(event);
        this.trackRemoteUsersInfoUpdates[event.user.uid] = false;
      }
      if (event.type == "user-unpublished") {
        console.log("this user unpublished", event);
        // From here we will only handle screen share close
        if (event.user.uid.slice(-1) == "s") {
          this.removeRemoteUser(event);
        } else if (event.mediaType === "video") {
          // this.onRemoteInfoChange();
          // update video track to existing user
          this.handleAddRemoteUser(event);
        }
      }
      if (event.type == "user-left") {
        console.log("this user left", event);
        this.removeRemoteUser(event);
      }
      if (event.type == "user-joined") {
        console.log("this user joined", event);
        this.onRemoteInfoChange();
      }

      if (event.type == "user-info-updated") {
        console.log("this user info updated", event);
      }
      if (event.type == "autoplay-blocked") {
        this.handleAutoPlayFailed.next(event);
      }

      //   setTimeout(() => {
      //     if (!this.trackRemoteUsersInfoUpdates[event.user.uid]) {
      //       this.removeRemoteUser(event);
      //       this.trackRemoteUsersInfoUpdates[event.user.uid] = false;
      //     }
      //   }, 100);
      // }
      // if (event.type == "user-info-updated") {
      //   console.log("this user info updated", event);
      //   this.trackRemoteUsersInfoUpdates[event.uid] = true;
      // }
      //   if (event.type == "network-quality") {
      //     if (event.stats.downlinkNetworkQuality) {
      //       this.mediaDataForView.forEach((media) => {
      //         if (media.userId == this.userDetails.user_id) {
      //           media.networkState = 6 - event.stats.downlinkNetworkQuality;
      //         }

      //         // for screen client
      //         if (media.userId == `${this.userDetails.user_id}s`) {
      //           media.networkState = 6 - event.stats.downlinkNetworkQuality;
      //         }
      //       });
      //     }
      //   }
      if (event.type == "DEVICE_OBTAINED") {
        this.getSystemInfo();
      }
      if (event.type == "screen-share-stopped") {
        this.disableScreenShare();
        this.isScreenShareEnabled = false;
      }
    });
  };

  isRegistered() {
    return this.agoraRTC.publisher.client;
  }

  // handle leave channel in background only for attendees
  handleBGChannelLeave() {
    if (this.handlerRole === RoleEnum.MODERATOR) return;
    clearTimeout(this.timeoutRef);
    this.timeoutRef = setTimeout(() => {
      // check for stream length
      if (!this.agoraRTC.publisher?.client?.remoteUsers.length) {
        this.leaveRoomChannel();
      }
    }, 120000); // 1 min
  }

  public startScene = async (mediaType: string = "", publish = true) => {
    // clearTimeout
    clearTimeout(this.timeoutRef);
    // check if user has already joined the channel or not
    if (!this.agoraRTC.publisher.isJoined) {
      await this.joinRoomChannel();
      this.handleBGChannelLeave(); // this is only implemented for audience
    }
    console.log("Start Publishing Stream");
    await this.upgradeUserRole();

    //create tracks if doesn't exist
    await this.createMediaTracks();

    if (publish) {
      this.isVideoPublished = false;
      this.isAudioPublished = false;
      this.isVideoEnabled = mediaType !== "audio";
      this.isAudioEnabled = true;
      await this.publishLocalStream(mediaType);

      // set the volume set by moderator
      // this.setLocalStreamVolume();
    }
  };

  publishLocalStream = async (mediaType = "video") => {
    try {
      clearTimeout(this.timeoutRef);
      // check if user has joined the event
      await this.joinRoomChannel();

      // publish video stream

      let streamDetails = {
        mediaType: mediaType || "video",
        user: {
          uid: this.userDetails.user_id,
        },
      };
      if (mediaType !== "audio" && !this.isVideoPublished) {
        if (this.isCameraMuted)
          await this.agoraRTC.publisher.tracks.video?.setEnabled(true);
        await this.agoraRTC.publishVideoStream();
        this.isVideoPublished = true;
        streamDetails.user["videoTrack"] = this.agoraRTC.publisher.tracks.video;
        if (this.isCameraMuted)
          await this.agoraRTC.publisher.tracks.video?.setEnabled(false);
      }

      if (mediaType !== "video" && !this.isAudioPublished) {
        if (this.isMicMuted)
          await this.agoraRTC.publisher.tracks.audio?.setEnabled(true);
        await this.agoraRTC.publishAudioStream();
        this.isAudioPublished = true;
        streamDetails.user["audioTrack"] = this.agoraRTC.publisher.tracks.audio;
        if (this.isMicMuted)
          await this.agoraRTC.publisher.tracks.audio?.setEnabled(false);
      }

      //  await this.agoraRTC.publish(mediaType);
      console.log(streamDetails, "local stream publish");
      this.handleAddRemoteUser(streamDetails);
    } catch (err) {
      console.log(err, "publish failled!");
    }
  };

  unPublishLocalStream = async (type: string = "") => {
    await this.agoraRTC.unPublishWithoutMediaTracks(type);
    if (type === "video") {
      this.isVideoEnabled = false;
      this.isVideoPublished = false;
    } else if (type === "audio") {
      this.isAudioEnabled = false;
      this.isAudioPublished = false;
    } else if (type === "screen") {
      this.isScreenSharePublished = false;
    }
  };

  joinRoomChannel = async (type = "", activeChannelId = this.activeEventId) => {
    this.userDetails.activeChannelId = activeChannelId;
    return new Promise(async (res, rej) => {
      if (
        !this.agoraRTC.publisher.isJoined &&
        !this.agoraRTC.isChannelJoining
      ) {
        try {
          const id = await this.agoraRTC.join(type, this.userDetails);
          if (!this.handleNetwork) {
            this.handleNetworkState();
            //create tracks if doesn't exist
            if (this.handlerRole === RoleEnum.MODERATOR)
              await this.createMediaTracks();
            return res(id);
          }
        } catch (err) {
          return rej(err);
        }
      } else if (this.agoraRTC.isChannelJoining) {
        setTimeout(() => {
          return res(this.userDetails.user_id);
        }, 2000);
      } else {
        if (!this.handleNetwork) {
          this.handleNetworkState();
        }
        return res(this.userDetails.user_id);
      }
    });
  };

  createMediaTracks = async (isMainTrack = true) => {
    await this.agoraRTC.createVideoTrack(
      this.selectedVideoDevice.deviceId,
      isMainTrack
    );
    await this.agoraRTC.createAudioTrack(
      this.selectedAudioDevice.deviceId,
      isMainTrack
    );
  };

  async leaveOnAir() {
    let downgradeRoleNeeded = false;
    if (this.isVideoEnabled) {
      await this.disableVideoCall();
      downgradeRoleNeeded = true;
    }
    if (this.isAudioEnabled) {
      await this.disableAudioCall();
      downgradeRoleNeeded = true;
    }

    if (this.isScreenSharePublished && !downgradeRoleNeeded) {
      await this.disableScreenShare();
      downgradeRoleNeeded = true;
    }
    if (downgradeRoleNeeded) {
      await this.downgradeUserRole();
    }
    this.onRemoteInfoChange();
  }

  async leaveRoomChannel() {
    await this.leaveOnAir();
    if (this.agoraRTC.publisher.isJoined) {
      await this.closeCameraMic();
      await this.agoraRTC.leave();
      clearInterval(this.handleNetwork);
      this.handleNetwork = null;
    }
    this.onRemoteInfoChange();
  }

  async startScreenSharing(channelId: string, publish = false) {
    if (this.isScreenShareEnabled && publish) {
      await this.publishScreenShare();
      // if screen is already enabled without publish
    } else {
      let userdata = this.userDetails;
      const userDetails = {
        ...userdata,
        screen_id: userdata.user_id + "s",
        activeChannelId: channelId,
      };
      try {
        await this.agoraRTC.shareScreen(userDetails, false);
        this.isScreenShareEnabled = true;
        if (publish) {
          await this.publishScreenShare();
        }
      } catch (err) {
        this.isScreenShareEnabled = false;
      }
    }
  }

  async publishScreenShare() {
    await this.agoraRTC.publishScreenTrack();
    this.isScreenSharePublished = true;
    const userData = {
      mediaType: "video",
      user: {
        uid: this.userDetails.user_id + "s",
        videoTrack: this.agoraRTC.publisher.tracks.screenVideoTrack,
      },
    };
    this.handleAddRemoteUser(userData);
    this.agoraRTC.publisher.tracks.screenVideoTrack.on("track-ended", () => {
      this.isScreenShareEnabled = false;
    });
    // this.agoraRTC.publisher.tracks.screenTrack.getVideoTracks()[0].onended =
    //   function () {
    //     this.isScreenShareEnabled = false;
    //   };
  }

  async switchVideoToAudio(publish = true) {
    // get off from on air scene
    if (this.isVideoEnabled) {
      await this.disableVideoCall();
    }

    // // go for audio call
    await this.startScene("audio", publish);
  }

  async switchAudioToVideo(publish = true) {
    // get off from on air scene
    await this.startScene("", publish);
  }

  async disableScreenShare() {
    //this.toggleScreenShare(false);
    await this.agoraRTC.stopScreenShare();
    this.isScreenSharePublished = false;
    this.isScreenShareEnabled = false;
    this.removeRemoteUser({
      user: {
        uid: this.userDetails.user_id + "s",
      },
      mediaType: "video",
    });
    // await this.agoraRTC.leave("screen");
    this.screenShare.next({ action: "stop" });
    // this.updateVideoLayout();
  }

  async disableAudioCall() {
    if (this.isAudioEnabled) {
      return this.agoraRTC
        .unPublish("audio")
        .then(async (id) => {
          this.isAudioEnabled = false;
          this.isVideoPublished = false;
          // this.agoraRTC.publisher.tracks.audio = null;
          // this.removeRemoteUser({
          //   user: {
          //     uid: this.userDetails.user_id,
          //   },
          //   mediaType: "audio",
          // });

          // if video is disabled than leave the channel
          if (!this.isVideoEnabled) {
            console.log(
              "no users in the room",
              this.agoraRTC.publisher.client.remoteUsers
            );
          }
        })
        .catch((err) => {
          console.log(err, "unpublish err");
          this.isAudioEnabled = false;
        });
    }
  }

  async disableVideoCall() {
    if (this.isVideoEnabled) {
      return this.agoraRTC
        .unPublish("video")
        .then(async () => {
          this.isVideoEnabled = false;
          this.isVideoPublished = false;
          // this.agoraRTC.publisher.tracks.video = null;
          this.removeRemoteUser({
            user: {
              uid: this.userDetails.user_id,
            },
            mediaType: "video",
          });

          // if audio is disabled than leave the channel
          if (!this.isAudioEnabled) {
            console.log(
              "no users in the room",
              this.agoraRTC.publisher.client.remoteUsers
            );
          }
        })
        .catch((err) => {
          console.log(err, "unpublish error");
          this.isVideoEnabled = false;
        });
    }
  }

  handleNetworkState() {
    setTimeout(() => {
      clearInterval(this.handleNetwork);
      this.handleNetwork = setInterval(() => {
        if (
          this.agoraRTC.publisher.client &&
          this.agoraRTC.publisher.isJoined
        ) {
          let networkStates =
            this.agoraRTC.publisher.client.getRemoteNetworkQuality();
          for (const [key, value] of Object.entries(networkStates)) {
            this.mediaDataForView.forEach((media) => {
              if (media.userId == key && value.uplinkNetworkQuality) {
                media.networkState = 6 - value.uplinkNetworkQuality;
              }
            });
          }
        }
      }, 2000);
    }, 1000);
  }

  isMainStream(remote, isModerator = false) {
    if (remote.mediaType === "video") return true;

    // if media type is audio then check the respective moderator or attendee live mode

    if (
      isModerator &&
      this.activeEventState.data?.moderator_active_mode === "audio"
    ) {
      return false;
    }

    if (!isModerator && !this.activeEventState.data?.attendeeVideoMode) {
      return false;
    }

    return true;
  }

  private handleAddRemoteUser = (remote) => {
    const remoteUser = remote.user;

    if (
      remoteUser.uid.charAt(remoteUser.uid.length - 1) == "s" &&
      remote.mediaType !== "video"
    ) {
      remoteUser?.audioTrack?.play();
      return;
    }

    const userDetails = null; // TODO: Fetch remote user info who joined as host
    let remoteUserData = this.mediaDataForView.find(
      (item) => item.peerId == remoteUser.uid
    );

    // check if remote user doesn't exist and stream gets unpublished just return from here
    if (!remoteUserData && remote.type === "user-unpublished") return;
    // get remote user details
    const participant = this.getLiveSceneUserDetail(remoteUser.uid);

    // check if it will go to main live scene or not
    const isMainStream = this.isMainStream(remote, participant?.isModerator);
    console.log(isMainStream, "check-1");
    if (!remoteUserData) {
      const data = {
        isModerator: participant?.isModerator,
        peerId: remoteUser.uid,
        userId: remoteUser.uid,
        // wideEleId: `${remoteUser.uid}_wide_video`,
        // gridEleId: `${remoteUser.uid}_grid_video`,
        // gridTopEleId: `${remoteUser.uid}_top_grid_video`,
        // gridMaxEleId: `${remoteUser.uid}_max_grid_video`,
        videoStream: remoteUser.videoTrack || null,
        audioStream: remoteUser.audioTrack || null,
        isScreenStream: false,
        displayName: participant ? participant.user.displayName : "",
        profile_picture: participant
          ? participant.user.profilePicture
          : "/assets/image/user.svg",

        isSpeaking: false,
        isMuted: false,
        isVideoEnabled: false,
        isAudioEnabled: false,
        // remoteMediaId: null,
        // networkState: 0,
      };

      // check if screen-share stream
      if (remoteUser.uid.slice(-1) == "s") {
        data.isScreenStream = true;
      }
      if (isMainStream) {
        this.mediaDataForView.push(data);
      }

      console.log(this.mediaDataForView, "check-2");
    }

    if (remote.mediaType == "video") {
      this.mediaDataForView.forEach((user) => {
        if (user.peerId == remoteUser.uid) {
          user.isVideoEnabled = !!remoteUser.videoTrack;
          user.videoStream = remoteUser.videoTrack;

          //   if (this.isShowGridView) {
          //     elementId = user.gridEleId;
          //     if (this.isAnyVideoMax) {
          //       elementId = user.gridTopEleId;
          //     }
          //   }
          // this.checkElementExistent(elementId).then((ele) => {
          //   setTimeout(() => {
          //     user.videoStream.play(elementId);
          //   }, 500);
          // });
        }
      });
    }

    if (remote.mediaType == "audio") {
      if (this.userDetails.user_id !== remote.user.uid)
        remoteUser?.audioTrack?.play();
      if (this.sidecallService.sidecallRoom)
        this.setAudioCommentryUsersVolume(
          this.sidecallService.currentOnAirRemoteUserVolume
        );
      this.mediaDataForView.forEach((user) => {
        if (user.peerId == remoteUser.uid) {
          user.audioStream = remoteUser.audioTrack;
          user.isAudioEnabled = true;
          // if (this.userDetails.user_id !== user.peerId) user.audioStream.play();
        }
      });
      this.updateRemoteUser.next({ action: "add" });
    }
    if (isMainStream) {
      clearTimeout(this.updateMediaTimer);
      this.updateMediaTimer = setTimeout(() => {
        this.updateRemoteUser.next({ action: "add" });
      }, 200);
    }
  };

  removeRemoteUser(remoteUser, removeMediaTrack = false) {
    console.log(remoteUser, "remove remote user");
    let userId = remoteUser.user.uid;
    // check if user is local user and and video is unpublished then only remove
    if (userId === this.userDetails.user_id && this.isVideoPublished) return;
    let removeFlag = false;
    const prevStreamLength = this.mediaDataForView.length;
    if (removeMediaTrack) {
      this.mediaDataForView.forEach((media) => {
        if (media.userId == userId) {
          if (remoteUser.mediaType == "video" && media.videoStream) {
            if (media.userId == this.userDetails.user_id) {
              this.agoraRTC.publisher.tracks.video = null;
              media.videoStream.close();
              this.agoraRTC.publisher.tracks.audio = null;
              media.audioStream.close();
            }
            // for screen track
            if (media.userId == `${this.userDetails.user_id}s`) {
              media.videoStream.close();
              this.agoraRTC.publisher.tracks.screenVideoTrack = null;
            }
            media.videoStream = null;
            media.isVideoEnabled = false;
            media.audioStream = null;
            media.isAudioEnabled = false;
          }
          if (remoteUser.mediaType == "audio" && media.audioStream) {
            if (media.userId == this.userDetails.user_id) {
              this.agoraRTC.publisher.tracks.audio = null;
              media.audioStream.close();
            }
            media.audioStream = null;
            media.isAudioEnabled = false;
          }
          if (!media.isVideoEnabled && !media.isAudioEnabled) {
            removeFlag = true;
          }
        }
      });
    }
    if (removeFlag || !removeMediaTrack) {
      this.mediaDataForView = this.mediaDataForView.filter(
        (item) => item.userId != userId
      );
    }
    // if (prevStreamLength !== this.mediaDataForView.length)
    this.updateRemoteUser.next({ action: "remove" });

    if (!this.mediaDataForView.length) {
      this.handleBGChannelLeave();
    }
  }

  private checkElementExistent = (id) => {
    return new Promise((res, rej) => {
      const existElemRef = setInterval(() => {
        let ele = document.getElementById(id);
        if (ele) {
          clearInterval(existElemRef);
          res(ele);
        }
      }, 100);
    });
  };

  private getSystemInfo = async () => {
    console.log(this.agoraRTC);
    this.audioDevices = this.agoraRTC.audioDevices;
    this.videoDevices = this.agoraRTC.videoDevices;

    // check if already a device is selected
    let prevVideoDeviceIndex = -1;
    if (this.selectedVideoDevice.deviceId) {
      // check if the device id exist in current videoDevices list
      prevVideoDeviceIndex = this.videoDevices.findIndex(
        (device) => device.deviceId === this.selectedVideoDevice.deviceId
      );
    }
    if (prevVideoDeviceIndex === -1) {
      this.selectedVideoDevice.deviceId = this.videoDevices[0].deviceId;
      this.selectedVideoDevice.label = this.videoDevices[0].label;
    }

    // check if already a device is selected
    let prevAudioDeviceIndex = -1;
    if (this.selectedAudioDevice.deviceId) {
      // check if the device id exist in current videoDevices list
      prevAudioDeviceIndex = this.audioDevices.findIndex(
        (device) => device.deviceId === this.selectedAudioDevice.deviceId
      );
    }
    if (prevAudioDeviceIndex === -1) {
      this.selectedAudioDevice.deviceId = this.audioDevices[0].deviceId;
      this.selectedAudioDevice.label = this.audioDevices[0].label;
    }

    // this.tempSelectedAudioDevice.deviceId = this.audioDevices[0].deviceId;
    // this.tempSelectedVideoDevice.deviceId = this.videoDevices[0].deviceId;

    // this.selectedVideoDevice.deviceId = this.videoDevices[0].deviceId;
    // this.selectedAudioDevice.label = this.audioDevices[0].label;
    // this.selectedVideoDevice.label = this.videoDevices[0].label;

    // create audio / video tracks
    // await this.createMediaTracks(false);

    if (!this.isDontAskChecked()) {
      this.checkCameraMicConfigurationPermissions();
    }

    // set selected device for side call
    this.sidecallService.selectedAudioDevice = this.selectedAudioDevice;
    this.sidecallService.selectedVideoDevice = this.selectedVideoDevice;
    this.mediaDevices.next(null);
  };

  async updateSelectedMediaDevices(deviceInfo) {
    if (deviceInfo.kind === "audioinput") {
      this.selectedAudioDevice.deviceId = deviceInfo.deviceId;
      this.selectedAudioDevice.label = deviceInfo.label;
      this.testAudioDevice();
    } else if (deviceInfo.kind === "videoinput") {
      this.selectedVideoDevice.deviceId = deviceInfo.deviceId;
      this.selectedVideoDevice.label = deviceInfo.label;
      this.testVideoDevice();
    }
    // set selected device for side call
    this.sidecallService.selectedAudioDevice = this.selectedAudioDevice;
    this.sidecallService.selectedVideoDevice = this.selectedVideoDevice;
  }

  isDontAskChecked() {
    let cookieName = "camera_mic_configuration";

    // read the cookie
    let name = cookieName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        // cookie found
        this.isCameraMicSettingsDontAskMeAgainChecked = true;
        return true;
      }
    }

    return false;
  }

  checkCameraMicConfigurationPermissions() {
    // setTimeout(() => {
    //   //  this.openCameraMicConfigurationModal();
    // }, 2000);
  }

  public testVideoDevice = async (): Promise<ICameraVideoTrack> => {
    // this will only respond when role is publisher
    // if (!this.agoraRTC.publisher.client) return;

    const videoTrack: ICameraVideoTrack = await this.agoraRTC.createVideoTrack(
      this.selectedVideoDevice.deviceId,
      false
    );
    await this.playLocalStream("test-video", videoTrack);
    return videoTrack;
  };

  async testAudioDevice(): Promise<IMicrophoneAudioTrack> {
    const audioTrack = await this.agoraRTC.createAudioTrack(
      this.selectedAudioDevice.deviceId,
      false
    );
    this.testAudio(audioTrack);
    return audioTrack;
  }

  testAudio(audioTrack) {
    let volumeLevel = 0;
    clearInterval(this.volumeHandler);
    this.volumeHandler = setInterval(() => {
      if (audioTrack) {
        volumeLevel = audioTrack.getVolumeLevel();
      }
      this.emitSpeakingVolume(volumeLevel);
    }, 200);
  }

  public toggleCamera = async (flag = this.isCameraMuted) => {
    if (
      this.agoraRTC.publisher.tracks?.video ||
      this.sidecallService.isPublish
    ) {
      this.isVideoStreamInProgress = true;
      // if it's a side call active then call side call method
      if (this.sidecallService.isPublish) {
        await this.sidecallService.toggleCamera(!!flag);
      } else {
        await this.agoraRTC.publisher.tracks.video.setEnabled(!!flag);
      }

      this.isCameraMuted = !flag;
      this.isVideoStreamInProgress = false;

      this.triggerLiveStreamAction.next({ type: "cameraMuted", data: {} });
      this.localStorageService.addItem(
        "cameraMuted",
        JSON.stringify(this.isCameraMuted)
      );
    }
  };
  public toggleMic = async (flag = this.isMicMuted) => {
    if (
      this.agoraRTC.publisher.tracks?.audio ||
      this.sidecallService.isPublish
    ) {
      this.isAudioStreamInProgress = true;
      if (this.sidecallService.isPublish) {
        await this.sidecallService.toggleMic(flag);
      } else {
        await this.agoraRTC.publisher.tracks.audio.setEnabled(flag);
        //this.isMicMuted = !flag;
        // if track is not published then publish first
        // if (!this.isAudioPublished && this.isAudioEnabled) {
        //   await this.publishLocalStream("audio");
        // }
      }
      this.isMicMuted = !flag;
      this.isAudioStreamInProgress = false;
      this.localStorageService.addItem(
        "micMuted",
        JSON.stringify(this.isMicMuted)
      );
    }
  };

  public toggleScreenShare = async (flag = this.isScreenShareMuted) => {
    if (this.agoraRTC.publisher.tracks?.screenVideoTrack) {
      await this.agoraRTC.publisher.tracks.screenVideoTrack.setEnabled(flag);
      this.isScreenShareMuted = !this.isScreenShareMuted;
    }
  };

  async closeCameraMic(mediaType = "") {
    if (!mediaType || mediaType === "audio") {
      if (this.agoraRTC.publisher.tracks?.audio) {
        await this.agoraRTC.publisher.tracks.audio.close();
        this.agoraRTC.publisher.tracks.audio = null;
      }
    }
    if (!mediaType || mediaType === "video") {
      if (this.agoraRTC.publisher.tracks?.video) {
        await this.agoraRTC.publisher.tracks.video.close();
        this.agoraRTC.publisher.tracks.video = null;
      }
    }
    clearInterval(this.volumeHandler);
  }

  public closeScreenShareStream = async () => {
    if (this.agoraRTC.publisher.tracks?.screenVideoTrack) {
      await this.stopScreenShareStream();
      await this.agoraRTC.publisher.tracks.screenVideoTrack.close();
      this.agoraRTC.publisher.tracks.screenVideoTrack = null;
      this.isScreenShareEnabled = false;
    }
  };

  public playLocalStream = async (elementId: string, videoTrack = null) => {
    videoTrack = videoTrack || this.agoraRTC.publisher.tracks?.video;
    if (!videoTrack) {
      videoTrack = await this.agoraRTC.createVideoTrack(
        this.selectedVideoDevice.deviceId,
        false
      );
    }
    let ele = document.getElementById(elementId);
    if (ele) ele.innerHTML = "";
    await videoTrack?.play(elementId);
  };

  public stopAudioLocalStream = async () => {
    if (this.agoraRTC.publisher.tracks?.audio) {
      await this.agoraRTC.publisher.tracks?.audio.stop();
    }
  };

  public stopLocalStream = async () => {
    if (this.agoraRTC.publisher.tracks?.video) {
      await this.agoraRTC.publisher.tracks?.video.stop();
    }
  };

  public playScreenShareStream = async (elementId) => {
    // make sure element exist
    await this.checkElementExistent(elementId);
    const screenTrack = this.agoraRTC.publisher.tracks?.screenVideoTrack;
    if (screenTrack) {
      await screenTrack.play(elementId);
    }
  };

  public stopScreenShareStream = async () => {
    const screenTrack = this.agoraRTC.publisher.tracks?.screenVideoTrack;
    if (screenTrack) {
      await screenTrack.stop();
    }
  };

  public setActiveEventState = async (data, emitStateUpdate = true) => {
    this.activeEventState.event_id = data.event_id;
    this.activeEventState.data = {
      ...this.activeEventState.data,
      ...data.data,
    };

    // check if moderator / attendee mode is audio mode then remove the user from the list
    console.log(data.data, "event state data");

    // if attendee mode is audio then make sure there should not be any remote stream in main scene
    if (
      !this.activeEventState.data?.attendeeVideoMode &&
      !this.activeEventState.data?.attendeeOnCommentry
    ) {
      const oldMediaCount = this.mediaDataForView.length;
      this.mediaDataForView = this.mediaDataForView.filter(
        (stream) => stream.isModerator || stream.isScreenStream
      );
      if (oldMediaCount !== this.mediaDataForView.length)
        this.updateRemoteUser.next({ action: "remove" });
    }

    // if moderator is on audio mode then make sure that there shouldn't be any moderator stream on main scene
    // if (
    //   this.activeEventState.data?.moderator_active_mode === "audio" &&
    //   !this.activeEventState.data?.moderatorWithCommentry
    // ) {
    //   this.mediaDataForView = this.mediaDataForView.filter(
    //     (stream) => !stream.isModerator
    //   );
    //   this.updateRemoteUser.next({ action: "remove" });
    // }

    // check if user has already joined the channel or not if media type is agora or agorascreen
    if (
      (this.activeEventState.data?.contentType === "agora" ||
        this.activeEventState.data?.contentType === "agorascreen") &&
      !this.agoraRTC.publisher.isJoined &&
      this.isRegistered()
    ) {
      await this.joinRoomChannel();
      this.handleBGChannelLeave();
    }
    //  this.updateActiveMediaStreams();
    if (emitStateUpdate) this.liveMediaStateUpdate.next(this.activeEventState);

    this.setRemoteStreamType(
      this.agoraRTC.publisher?.client?.remoteUsers,
      this.activeEventState.data?.contentType === "externalMedia"
        ? "low"
        : "high"
    );
  };

  async downgradeUserRole() {
    await this.agoraRTC.downgradeUserRole();
  }

  async upgradeUserRole() {
    await this.agoraRTC.upgradeUserRole();
  }

  async isVideoMuted(stream: AgoraMediaStream) {
    let videoMuted = stream?.isVideoMuted;
    if (this.userDetails.user_id === stream.userId) {
      videoMuted = this.isCameraMuted;
    }

    return videoMuted;
  }

  isVideoTrackExist() {
    return this.agoraRTC.publisher.tracks?.video;
  }

  isAudioTrackExist() {
    return this.agoraRTC.publisher.tracks?.audio;
  }

  getToken(channelId, userId) {
    return new Promise((res, rej) => {
      this._httpService
        .getAgoraToken(channelId, userId)
        .then((token) => {
          return res(token);
        })
        .catch((err) => rej(err));
    });
  }

  getLiveSceneUserDetail(userId) {
    const participant = this.eventParticipants.find(
      (participant) => participant.user.userId === userId
    );

    return participant;
  }

  public handleSwitchLocalAgoraStream = async (
    action: string,
    elementId: string,
    streamType: string
  ) => {
    if (action === "goLive") {
      // check either to go live with local video stream or screen share
      if (streamType === "agora") {
        // Publish local stream
        await this.upgradeUserRole();
        await this.startScene(""); // publish both audio and video track
      }
    } else if (action === "goRight") {
      if (streamType === "agora" && this.isVideoEnabled) {
        // unpublish local stream
        await this.leaveOnAir();
        //Play local stream
        await this.playLocalStream(elementId);
      } else if (streamType === "agorascreen") {
        // unpublish screen share stream
        if (this.isScreenSharePublished) {
          await this.unPublishLocalStream("screen");
          await this.stopScreenShareStream();
          await this.playScreenShareStream(elementId);
          this.removeRemoteUser({
            user: {
              uid: this.userDetails.user_id + "s",
            },
            mediaType: "video",
          });
        }
      }
    }
  };

  // setLocalStreamVolume() {
  //   let volume = this.activeEventState.data?.audioCommantryVolume;
  //   if (typeof volume === "undefined") {
  //     volume = 100;
  //   }
  //   if (volume) {
  //     volume = volume < 0 ? 100 : volume;
  //   }

  //   this.agoraRTC.adjustLocalAudioVolume(volume);
  // }

  isMicAndCameraBlocked() {
    if (
      this.selectedAudioDevice.deviceId &&
      this.selectedVideoDevice.deviceId
    ) {
      return true;
    }
    return false;
  }

  setHoldStateData(value1, value2) {
    this.isHoldState = value1;
    this.isSelectedInHoldState = value2;
  }

  showVideoButton() {
    // check to show video button in left menu
    if (this.handlerRole === RoleEnum.MODERATOR) {
      return !!this.isVideoTrackExist();
    } else {
      // check if attendee is live either in main scene or side call
      return (
        this.isVideoEnabled ||
        (this.sidecallService.isPublish &&
          this.sidecallService.sidecallRoom?.callType ===
            SideCallEnum.CALLTYPE_VIDEO)
      );
    }
  }

  showAudioButton() {
    // check to show video button in left menu
    if (this.handlerRole === RoleEnum.MODERATOR) {
      return !!this.isAudioTrackExist();
    } else {
      // check if attendee is live either in main scene or side call
      return this.isAudioEnabled || this.sidecallService.isPublish;
    }
  }

  handleFullScreen() {
    this.handleAttendeeCards()
    this.isFullScreenActive = !this.isFullScreenActive;
    this.fullScreenHandler.next({ isFullScreen: this.isFullScreenActive });
  }

  setAudioCommentryUsersVolume(mediaVolume) {
    this.agoraRTC.publisher?.client?.remoteUsers.map((stream) => {
      stream?.audioTrack?.setVolume(mediaVolume);
    });
  }

  setLocalYoutubeVolume(mediaVolume) {
    this.liveMediaStateUpdateBySideCall.next(mediaVolume);
  }

  getNumberOfUserOnAir() {
    const remoteUsers = this.agoraRTC.publisher?.client?.remoteUsers.length;
    return remoteUsers;
  }

  checkParticipantOnAir(participant_user_id) {
    // check if i m on air
    if (participant_user_id === this.userDetails.user_id) {
      return this.isVideoEnabled || this.isAudioEnabled;
    } else {
      // check in remote media stream if participant exist
      return this.agoraRTC.publisher?.client?.remoteUsers.find(
        (remoteUser) => remoteUser.uid === participant_user_id
      );
    }
  }

  // take action when remote user stream info updated
  onRemoteInfoChange() {
    const remoteUsers = [...this.agoraRTC.publisher?.client?.remoteUsers];
    console.log("remote users", remoteUsers);
    // if (this.isVideoEnabled || this.isAudioEnabled)
    //   remoteUsers.push({
    //     uid: this.userDetails.user_id,
    //     hasAudio: true,
    //     hasVideo: true,
    //   });
    // update the local media if there is any difference
    this.mediaDataForView.map((existingUser) => {
      // check if this existing media exist in remote users
      const mediaIndex = remoteUsers.findIndex(
        (remoteUser) => remoteUser.uid === existingUser.userId
      );
      if (
        mediaIndex === -1 &&
        existingUser.userId !== this.userDetails.user_id
      ) {
        // delete this existing user
        this.removeRemoteUser({ user: { uid: existingUser.userId } });
      } else if (mediaIndex !== -1) {
        remoteUsers.splice(mediaIndex, 1);
      }
    });

    // if still users exist in remote users then add those
    console.log(
      remoteUsers,
      this.activeEventState.data,
      "remote user addeddddddd"
    );
    if (this.activeEventState.data?.attendeeVideoMode)
      remoteUsers.map((remoteUser) => {
        this.handleAddRemoteUser({ user: { uid: remoteUser.uid } });
      });
  }

  async fetchConnectedDevices() {
    await this.agoraRTC.getDevices();
  }

  async applyMediaDeviceChange() {
    // check if user is in side call
    if (this.sidecallService.isPublish) {
      this.sidecallService.selectedVideoDevice = this.selectedVideoDevice;
      this.sidecallService.selectedAudioDevice = this.selectedAudioDevice;
      this.sidecallService.applyMediaDeviceChange();
    }
    if (this.selectedVideoDevice.deviceId)
      await this.agoraRTC.switchVideoDevice(this.selectedVideoDevice.deviceId);
    if (this.selectedAudioDevice.deviceId)
      await this.agoraRTC.switchAudioDevice(this.selectedAudioDevice.deviceId);
    clearInterval(this.volumeHandler);
  }

  onVideoCallUserSelected(streamId) {
    this.callUserSelected.next(streamId);
  }

  setRemoteStreamType(remoteUsers = [], type = "low") {
    // subscribe to low resolution video stream
    remoteUsers.map((remoteUser) =>
      this.agoraRTC.setRemoteStreamType(
        remoteUser.uid || remoteUser.userId,
        type
      )
    );
  }
  getNumberOfUserOnAirWithoutAgoraScreen() {
    const remoteUsers = this.agoraRTC.publisher?.client?.remoteUsers;
    let userCount = 0;
    for (let user of remoteUsers) {
      let userId = user.uid.toString();
      if (userId[userId.length - 1] !== "s") {
        userCount++;
      }
    }
    return userCount;
  }

  handleAttendeeCards(){
    let cards = document?.getElementById("attendeeCards");
    if (this.isFullScreenActive) {
      cards.style.display = 'flex';
    }
    else{
      cards.style.display = 'none';
    }
  }

}
