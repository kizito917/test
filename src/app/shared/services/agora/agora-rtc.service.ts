import { EventEmitter, Injectable } from "@angular/core";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { Publisher } from "../../interfaces/publisher.interface";
import { AuthService } from "src/app/shared";
import { GlobalVariable } from "../../global-variable/index";
import { Receiver } from "../../interfaces/receiver.interface";

@Injectable({
  providedIn: "root",
})
export class AgoraRtcService {
  public credentials: {};
  public setupDone: boolean;
  public publisher: Publisher;
  public receiver: Receiver;
  public screenId: string;
  // public remotes: RemoteUser[];
  public audioDevices: Array<any>;
  public videoDevices: Array<any>;

  public isChannelJoining = false;
  private tokens = {};
  public clientRole = "publisher";
  public clientType = "live";

  public _agora = new EventEmitter<any>();
  constructor() {
    AgoraRTC.setLogLevel(0);
    AgoraRTC.enableLogUpload();
    this.publisher = {
      tracks: {
        audio: null,
        audioId: null,
        audioVolume: 100,
        video: null,
        videoId: null,
        //screenTrack: null,
        screenVideoTrack: null,
        screenAudioTrack: null,
      },
      client: null,
      screenClient: null,
      isJoined: false,
      isScreenJoined: false,
    };

    this.receiver = {
      client: null,
      isJoined: false,
    };

    this.setupDone = false;
  }

  private createClient = () => {
    if (this.clientType === "live") {
      return AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });
    }
    return AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });
  };

  async initPublisherSession() {
    this.publisher.client = await this.createClient();
    try {
      await this.publisher.client.enableDualStream();
      console.log("Dual staream is enabled");
    } catch (err) {
      console.warn("Dual stream is unavailable");
    }
    return new Promise((res) => res(this.publisher.client));
  }

  async initReceiverSession() {
    this.publisher.client = await this.createClient();
    return new Promise((res) => res(this.receiver.client));
  }

  async initSession(role = "publisher", clientType = "live") {
    this.clientType = clientType;
    await this.getDevices();
    this.clientRole = role;
    role === "publisher"
      ? await this.initPublisherSession()
      : await this.initReceiverSession();
    // registering for auto play failed
    this.handleAutoPlayBlock();
    this.handleDeviceChange();
  }

  shareScreen(userDetails, publish = false) {
    return new Promise(async (res, rej) => {
      try {
        this.screenId = userDetails.screen_id;
        await this.joinForScreen(userDetails);
        // create screen track if it's not created
        await this.createScreenVideoTrack();
        if (publish) {
          await this.publishScreenTrack();
        }
        res(true);
      } catch (err) {
        rej(err);
      }
    });
  }

  joinForScreen(userDetails) {
    return new Promise(async (res, rej) => {
      if (!this.publisher.screenClient) {
        // create client join channel and share screen
        try {
          this.publisher.screenClient = await this.createScreenClient();
        } catch (e) {
          console.log(e, "create screen error");
        }

        try {
          await this.join("screen", userDetails);
          return res(true);
        } catch (e) {
          return rej(e);
        }
      } else {
        if (this.publisher.screenClient.uid) {
          return res(true);
        } else {
          // client exist but have not joined the channel just join channel and share screen
          await this.join("screen", userDetails);
          return res(true);
        }
      }
    });
  }

  async createScreenVideoTrack() {
    if (!this.publisher.tracks.screenVideoTrack) {
      const track = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: "1080p_1",
        },
        "auto"
      );
      if (Array.isArray(track)) {
        this.publisher.tracks.screenVideoTrack = track[0];
        this.publisher.tracks.screenAudioTrack = track[1];
      } else this.publisher.tracks.screenVideoTrack = track;
      this.setupTrackHandlers();
      return true;
    }
  }

  async stopScreenShare() {
    await this.unpublishScreenTrack();
  }

  private createScreenClient() {
    return Promise.resolve(
      AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      })
    );
  }

  async publishScreenTrack() {
    return new Promise(async (res, rej) => {
      try {
        if (this.publisher.client.remoteUsers.length < 8) {
          await this.createScreenVideoTrack();
          await this.publisher.screenClient.publish([
            this.publisher.tracks.screenVideoTrack,
          ]);
          if (this.publisher.tracks.screenAudioTrack)
            await this.publisher.screenClient.publish([
              this.publisher.tracks.screenAudioTrack,
            ]);
          res(true);
        } else {
          rej(false);
        }
      } catch (err) {
        rej(err);
      }
    });
  }

  async unpublishScreenTrack(withMediaTracks = true) {
    if (this.publisher.tracks.screenVideoTrack) {
      if (this.publisher.tracks.screenVideoTrack)
        await this.publisher.screenClient.unpublish([
          this.publisher.tracks.screenVideoTrack,
        ]);
      if (this.publisher.tracks.screenAudioTrack)
        await this.publisher.screenClient.unpublish([
          this.publisher.tracks.screenAudioTrack,
        ]);
      // this.publisher.tracks.screenTrack.stop();
      if (withMediaTracks) {
        this.unregisterTrackHandlers();
        this.publisher.tracks.screenVideoTrack.close();
        this.publisher.tracks.screenVideoTrack = null;
        this.publisher.tracks.screenAudioTrack?.close();
        this.publisher.tracks.screenAudioTrack = null;
      }
    }
  }

  async createAudioTrack(
    deviceId,
    isMainTrack = true
  ): Promise<IMicrophoneAudioTrack> {
    return new Promise(async (resolve, reject) => {
      if (!this.publisher.tracks.audio || !isMainTrack) {
        if (!deviceId) {
          deviceId = this.audioDevices[0].deviceId;
        }
        try {
          const track = await AgoraRTC.createMicrophoneAudioTrack({
            microphoneId: deviceId,
            AEC: true, // acoustic echo cancellation
            AGC: true, // audio gain control
            ANS: true, // automatic noise suppression
            encoderConfig: "speech_standard",
          });
          if (isMainTrack) {
            this.publisher.tracks.audioVolume = 100;
            this.publisher.tracks.audioId = deviceId;
            this.publisher.tracks.audio = track;
          }
          resolve(track);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(this.publisher.tracks.audio);
      }
    });
  }

  async createVideoTrack(
    deviceId,
    isMainTrack = true
  ): Promise<ICameraVideoTrack> {
    return new Promise(async (resolve, reject) => {
      if (!this.publisher.tracks.video || !isMainTrack) {
        if (!deviceId) {
          deviceId = this.videoDevices[0].deviceId;
        }
        try {
          const track: ICameraVideoTrack =
            await AgoraRTC.createCameraVideoTrack({
              cameraId: deviceId,
              encoderConfig: "480p_1",
              optimizationMode: "motion",
            });
          if (isMainTrack) {
            this.publisher.tracks.videoId = deviceId;
            this.publisher.tracks.video = track;
          }
          resolve(track);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(this.publisher.tracks.video);
      }
    });
  }

  async createBothTracks(videoId = null, audioId = null) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createAudioTrack(audioId);
        await this.createVideoTrack(videoId);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  // type : screen/''
  join(type: string = "", userDetails: any) {
    return new Promise(async (resolve, reject) => {
      // check if channel is already joined
      // if (this.publisher.client.uid) {
      //   // user has already joined
      //   return resolve(userDetails.user_id);
      // }
      // just join the channel
      // if (this.isChannelJoining) {
      //   return rej(false);
      // }
      this.isChannelJoining = true;
      let channelId = `${userDetails.activeChannelId}`;
      let token = null;
      let userId = userDetails.user_id;
      token = userDetails.rtcToken || null;
      if (type == "screen") {
        userId = userDetails.screen_id;
        token = userDetails.screenShareToken || null;
      }

      try {
        console.log(token, "this is the token");
        if (!type) {
          if (this.publisher.client) {
            this.setupClientHandlers();
            // this.publisher.client.setLowStreamParameter({
            //   width: 320,
            //   height: 240,
            //   framerate: 15,
            //   bitrate: 200,
            // });
            try {
              console.log("this is the channel id km", channelId);
              let uid = await this.publisher.client.join(
                GlobalVariable.AGORA_APP_ID,
                channelId,
                token, // this.credentials[channelId].token,
                userId
              );
              this.publisher.isJoined = true;
              this.isChannelJoining = false;
              return resolve(uid);
            } catch (err) {
              this.publisher.isJoined = false;
              this.isChannelJoining = false;
              return reject(err);
            }
          }
        }
        // channel join by screenClient
        if (type == "screen" && this.publisher.screenClient) {
          try {
            this.registerScreenclientHandler();
            this.publisher.screenClient.setLowStreamParameter({
              width: 640,
              height: 360,
              framerate: 15,
              bitrate: 400,
            });
            let suid = await this.publisher.screenClient.join(
              GlobalVariable.AGORA_APP_ID,
              channelId,
              token,
              userId // screenclient id
            );
            this.publisher.isScreenJoined = true;
            this.isChannelJoining = false;
            return resolve(suid);
          } catch (err) {
            this.publisher.isScreenJoined = false;
            this.isChannelJoining = false;
            return reject(err);
          }
        }
      } catch (err) {
        this.isChannelJoining = false;
        return reject(err);
      }
    });
  }

  async leave(type: string = "") {
    if (type === "screen") {
      await this.publisher?.screenClient.leave();
      this.publisher.isScreenJoined = false;
      this.unregisterScreenclientHandler();
    } else {
      await this.unPublish("video");
      await this.unPublish("audio");
      await this.publisher.client.leave();
      if (this.clientType === "live")
        await this.publisher.client.setClientRole("audience");
      this.publisher.isJoined = false;
      this.unregisterCallbacks();
    }
  }

  // if type is not specified publish both the tracks
  async publish(streamType: string = "") {
    return new Promise(async (res, rej) => {
      if (this.publisher.client.remoteUsers.length < 17) {
        if (this.clientType === "live")
          await this.publisher.client.setClientRole("host");
        if (streamType == "audio" || !streamType) {
          const resp = await this.publishAudioStream();
          if (resp) res(true);
          else rej(false);
          // this.publisher.client
          //   .publish([this.publisher.tracks.audio])
          //   .then(() => {
          //     res(true);
          //   })
          //   .catch((err) => {
          //     rej(err);
          //   });
        }
        if (streamType == "video" || !streamType) {
          const resp = await this.publishVideoStream();
          if (resp) res(true);
          else rej(false);
          // this.publisher.client
          //   .publish([this.publisher.tracks.video])
          //   .then(() => {
          //     res(true);
          //   })
          //   .catch((err) => {
          //     rej(err);
          //   });
        }

        // // publish both tracks if type is not specified
        // if (!streamType) {
        //   this.publisher.client
        //     .publish([this.publisher.tracks.video, this.publisher.tracks.audio])
        //     .then(() => {
        //       res(true);
        //     })
        //     .catch((err) => {
        //       rej(err);
        //     });
        // }
      } else {
        rej(false);
      }
    });
  }

  async publishAudioStream() {
    if (!this.publisher.tracks?.audio["_enabled"]) return true;
    try {
      await this.publisher.client.publish([this.publisher.tracks.audio]);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async publishVideoStream() {
    if (!this.publisher.tracks?.video["_enabled"]) return true;
    try {
      await this.publisher.client.publish([this.publisher.tracks.video]);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // if type is not specified unpublish both the tracks
  async unPublish(type: string = "") {
    return new Promise(async (res, rej) => {
      if (type == "audio") {
        if (this.publisher.tracks.audio) {
          this.publisher.client
            .unpublish([this.publisher.tracks.audio])
            .then((id) => {
              this.publisher.tracks?.audio.stop();
              res(true);
            })
            .catch((err) => {
              console.log(err, "unpublish error");
              rej(err);
            });
        } else {
          res({ error: "audio track is not available" });
        }
      }
      if (type == "video") {
        if (this.publisher.tracks.video) {
          this.publisher.client
            .unpublish([this.publisher.tracks.video])
            .then((id) => {
              this.publisher.tracks?.video.stop();
              res(id);
            })
            .catch((err) => {
              console.log(err, "unpublish error");
              rej(err);
            });
        } else {
          res({ error: "could not find video track" });
        }
      }
      if (!type) {
        this.publisher.client
          .unpublish([this.publisher.tracks.video, this.publisher.tracks.audio])
          .then(() => {
            res(true);
          })
          .catch((err) => {
            rej(err);
          });
      }
    });
  }

  async unPublishWithoutMediaTracks(type: string = "") {
    try {
      if (type === "video" && this.publisher.tracks.video) {
        await this.publisher.client.unpublish([this.publisher.tracks.video]);
      }
      if (type === "audio" && this.publisher.tracks.audio) {
        await this.publisher.client.unpublish([this.publisher.tracks.audio]);
      }
      if (type === "screen") {
        await this.unpublishScreenTrack(false);
        //  this.unregisterTrackHandlers();
      }
    } catch (err) {
      console.log(err, "unpublish error");
    }
  }

  getRemoteNetworkQuality() {
    return this.publisher.client.getRemoteNetworkQuality();
  }

  async upgradeUserRole() {
    await this.publisher.client.setClientRole("host");
  }

  async downgradeUserRole() {
    // this.unPublish();
    await this.publisher.client.setClientRole("audience");
  }

  async switchVideoDevice(deviceId) {
    this.publisher.tracks.videoId = deviceId;
    //await this.publisher.tracks?.video?.stop();
    if (this.publisher.tracks.video && deviceId) {
      return this.publisher.tracks.video
        .setDevice(deviceId)
        .then(() => {
          console.log("set device success");
        })
        .catch((e) => {
          console.log("set device error", e);
        });
    }
  }

  async switchAudioDevice(deviceId) {
    this.publisher.tracks.audioId = deviceId;
    // await this.publisher.tracks?.audio?.stop();
    if (this.publisher.tracks.audio && deviceId) {
      return this.publisher.tracks.audio
        .setDevice(deviceId)
        .then(() => {
          console.log("set device success");
        })
        .catch((e) => {
          console.log("set device error", e);
        });
    }
  }

  async setRemoteStreamType(userId, type) {
    let flag = 0;
    if (this.publisher.client) {
      if (type == "low") {
        flag = 1;
      }
      if (type == "high") {
        flag = 0;
      }
      await this.publisher.client.setRemoteVideoStreamType(userId, flag);
    }
  }

  onUserPublished = async (user, mediaType) => {
    try {
      console.log("yes user is publishing");
      const uid = user.uid;
      if (uid != this.screenId) {
        await this.publisher.client.subscribe(user, mediaType);
        await this.publisher.client.setStreamFallbackOption(uid, 2);
        if (mediaType === "video") {
          await this.setRemoteStreamType(uid, "low");
        }
        if (mediaType === "audio") {
        }
        let emitData = { type: "user-published", user, mediaType };
        this._agora.emit(emitData);
      }
    } catch (err) {
      console.log("Error in user subscription ", err);
    }
  };

  onUserUnpublished = async (user, mediaType) => {
    // await this.publisher.client.unsubscribe(user, mediaType);
    if (mediaType === "video") {
      console.log("unsubscribe video success");
    }
    if (mediaType === "audio") {
      console.log("unsubscribe audio success");
    }
    let emitData = { type: "user-unpublished", user, mediaType };
    this._agora.emit(emitData);
  };

  onUserJoined = async (user) => {
    // triggers when host join the channel
    console.log("user joined ", user);
    let emitData = { type: "user-joined", user };
    this._agora.emit(emitData);
  };

  onUserLeft = async (user, reason) => {
    // triggers when host join the channel
    if (reason == "Quit") {
      // when user left the channel
    }

    if (reason == "ServerTimeOut") {
      // when user dropped off
    }

    if (reason == "BecomeAudience") {
      // when user become audience from the host
    }
    let emitData = { type: "user-left", user, reason };
    this._agora.emit(emitData);
  };

  networkQualityHandler = async (stats) => {
    // network stats
    let emitData = { type: "network-quality", stats };
    this._agora.emit(emitData);
  };

  screenNetworkQualityHandler = (stats) => {
    // network stats
    let emitData = { type: "network-quality", stats };
    this._agora.emit(emitData);
  };

  volumeIndicatorHandler = async (result) => {
    let emitData = { type: "volume-indicator", result };
    this._agora.emit(emitData);
  };

  userInfoUpdatedHandler = async (uid, msg) => {
    let emitData = { type: "user-info-updated", uid, msg };
    this._agora.emit(emitData);
  };

  connectionStateChange = async (curState, revState, reason) => {
    console.log(curState, "current state");
    console.log(revState, "previous state");
    console.log(reason, "reason state");
  };

  unregisterCallbacks() {
    this.publisher.client.off("user-published", this.onUserPublished);
    this.publisher.client.off("user-unpublished", this.onUserUnpublished);
    this.publisher.client.off("user-joined", this.onUserJoined);
    this.publisher.client.off("user-left", this.onUserLeft);
    this.publisher.client.off("network-quality", this.networkQualityHandler);
    this.publisher.client.off("volume-indicator", this.volumeIndicatorHandler);
    this.publisher.client.off("user-info-updated", this.userInfoUpdatedHandler);
  }

  public setupClientHandlers() {
    console.log("yes setuping client handlers");
    this.publisher.client.enableAudioVolumeIndicator();
    this.publisher.client.on("user-published", this.onUserPublished);
    this.publisher.client.on("user-unpublished", this.onUserUnpublished);
    this.publisher.client.on("user-joined", this.onUserJoined);
    this.publisher.client.on("user-left", this.onUserLeft);
    this.publisher.client.on("network-quality", this.networkQualityHandler);
    this.publisher.client.on("volume-indicator", this.volumeIndicatorHandler);
    this.publisher.client.on("user-info-updated", this.userInfoUpdatedHandler);

    this.publisher.client.on(
      "connection-state-change",
      this.connectionStateChange
    );
  }

  private registerScreenclientHandler() {
    this.publisher.client.on(
      "network-quality",
      this.screenNetworkQualityHandler
    );
  }

  private unregisterScreenclientHandler() {
    this.publisher.client.off(
      "network-quality",
      this.screenNetworkQualityHandler
    );
  }

  private setupTrackHandlers() {
    if (this.publisher.tracks.screenVideoTrack) {
      this.publisher.tracks.screenVideoTrack.on(
        "track-ended",
        this.trackHandler
      );
    }
  }

  private unregisterTrackHandlers() {
    if (this.publisher.tracks.screenVideoTrack) {
      this.publisher.tracks.screenVideoTrack.off(
        "track-ended",
        this.trackHandler
      );
    }
  }

  trackHandler = () => {
    const emmitData = {
      type: "screen-share-stopped",
    };
    this._agora.emit(emmitData);
  };

  public checkSystemRequirement() {
    if (!AgoraRTC.checkSystemRequirements()) {
      return Promise.reject({
        status: false,
        info: "Not Fullfill System Requirements",
        type: "NOT_SUPPORTED",
        message:
          "This browser does not support to join channel using camera and microphone.",
      });
    }

    return Promise.resolve(true);
  }

  public async getDevices() {
    try {
      const devices = await AgoraRTC.getDevices();
      this.audioDevices = devices.filter((x) => x.kind == "audioinput");
      this.videoDevices = devices.filter((x) => x.kind == "videoinput");
      const emitData = { type: "DEVICE_OBTAINED" };
      this._agora.emit(emitData);
    } catch (error) {
      if (error.code === "PERMISSION_DENIED") {
        let emitData = { type: "DEVICE_PERMISSION_DENIED" };
        this._agora.emit(emitData);
      }
      console.log(error);
    }
  }

  adjustLocalAudioVolume(volume: number) {
    if (this.publisher.tracks.audio) {
      this.publisher.tracks.audio.setVolume(volume);
    }
  }

  private handleAutoPlayBlock() {
    const emitData = { type: "autoplay-blocked" };
    AgoraRTC.onAutoplayFailed = () => {
      this._agora.emit(emitData);
    };
  }

  private handleDeviceChange() {
    AgoraRTC.onCameraChanged = async (changedDevice) => {
      const cameraTrack = this.publisher.tracks.video;
      console.log("camera changed!", changedDevice.state, changedDevice.device);
      // When plugging in a device, switch to a device that is newly plugged in.
      if (changedDevice.state === "ACTIVE") {
        await this.switchVideoDevice(changedDevice.device.deviceId);
        // Switch to an existing device when the current device is unplugged.
      } else if (changedDevice.device.label === cameraTrack.getTrackLabel()) {
        const oldCameras = await AgoraRTC.getCameras();
        if (oldCameras[0]) {
          await this.switchVideoDevice(oldCameras[0].deviceId);
        }
      }
    };

    AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
      console.log(
        "microphone changed!",
        changedDevice.state,
        changedDevice.device
      );
      const microphoneTrack = this.publisher.tracks.audio;
      // When plugging in a device, switch to a device that is newly plugged in.
      if (changedDevice.state === "ACTIVE") {
        await this.switchAudioDevice(changedDevice.device.deviceId);
        // Switch to an existing device when the current device is unplugged.
      } else if (
        changedDevice.device.label === microphoneTrack.getTrackLabel()
      ) {
        const oldMicrophones = await AgoraRTC.getMicrophones();
        if (oldMicrophones[0]) {
          await this.switchAudioDevice(oldMicrophones[0].deviceId);
        }
      }
    };
  }
}
