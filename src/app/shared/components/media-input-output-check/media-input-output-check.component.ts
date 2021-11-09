import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  AgoraRtcStreamHandlerService,
  getUserFromLocalStorage,
} from "../../services";
import { FormBuilder, FormGroup } from "@angular/forms";
import { UserInterface } from "../../interfaces/user.interface";
import {
  ICameraVideoTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

import { LocalStorageService } from "../../services/local-storage/local-storage.service";

@Component({
  selector: "app-media-input-output-check",
  templateUrl: "./media-input-output-check.component.html",
  styleUrls: ["./media-input-output-check.component.scss"],
})
export class MediaInputOutputCheckComponent implements OnInit, OnDestroy {
  public mediaInputOutputSettingFG: FormGroup;

  public showDeviceSettingForm = false;
  public micDevices = [];
  public cameraDevices = [];
  public selectedCameraDevice = null;
  public selectedMicDevice = null;
  public audioVolume = 0; // used for testing mic before event start
  public is_audio_on = true;
  public is_video_on = true;
  castSpeakingVolumeSubscription: Subscription;
  castMediaDevicesSubscription: Subscription;

  @Output() submitClick = new EventEmitter<string>();
  @Input() loading;
  @Input() submitText = "Start Event";
  videoTrack: ICameraVideoTrack;
  audioTrack: IMicrophoneAudioTrack;
  isCameraMuted = false;
  isMicMuted = false;
  user: UserInterface;
  constructor(
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    private localStorageService: LocalStorageService,
    private _fb: FormBuilder
  ) {
    this.mediaInputOutputSettingFG = this._fb.group({
      audio: ["", []],
      video: ["", []],
    });
  }

  async ngOnInit() {
    this.user = getUserFromLocalStorage();
    await this.agoraRTCStreamHandler.fetchConnectedDevices();
    //await this.initAgoraSession();
    this.castMediaDevicesSubscription =
      this.agoraRTCStreamHandler.castMediaDevices.subscribe(async () => {
        this.selectedCameraDevice =
          this.agoraRTCStreamHandler.selectedVideoDevice.deviceId;
        this.selectedMicDevice =
          this.agoraRTCStreamHandler.selectedAudioDevice.deviceId;
        this.cameraDevices = this.agoraRTCStreamHandler.videoDevices;
        this.micDevices = this.agoraRTCStreamHandler.audioDevices;
        if (this.cameraDevices.length)
          this.videoTrack = await this.agoraRTCStreamHandler.testVideoDevice();
        if (this.micDevices.length)
          this.audioTrack = await this.agoraRTCStreamHandler.testAudioDevice();
        if (this.isCameraMuted) {
          this.videoTrack?.setEnabled(false);
        }
        if (this.isMicMuted) {
          this.audioTrack?.setEnabled(false);
        }
      });

    // Initiate testing of mic and camera
    this.castSpeakingVolumeSubscription =
      this.agoraRTCStreamHandler.castSpeakingVolume.subscribe(
        (speakingVolume) => {
          this.audioVolume = this.isMicMuted ? 0 : speakingVolume * 100;
        }
      );

    this.isCameraMuted =
      this.localStorageService.getItem("cameraMuted", "false") === "true"
        ? true
        : false;

    this.isMicMuted =
      this.localStorageService.getItem("micMuted", "false") === "true"
        ? true
        : false;
  }

  async initAgoraSession() {
    // start agora local session
    await this.agoraRTCStreamHandler.initializeAgoraClient();
  }

  toggleDeviceSettingForm() {
    this.showDeviceSettingForm = !this.showDeviceSettingForm;
  }

  onChangeMediaDevice(deviceInfo) {
    this.agoraRTCStreamHandler.updateSelectedMediaDevices(deviceInfo);
  }

  proceedToEvent(event) {
    this.submitClick.next(event);
  }

  getUserProfileImage() {
    return this.user.profile_picture || "/assets/image/user.svg";
  }

  toggleCamera() {
    this.videoTrack.setEnabled(this.isCameraMuted);
    this.agoraRTCStreamHandler.toggleCamera(this.isCameraMuted);
    this.isCameraMuted = !this.isCameraMuted;
    this.localStorageService.addItem("cameraMuted", JSON.stringify(this.isCameraMuted));
    this.agoraRTCStreamHandler.isCameraMuted=this.isCameraMuted;
  }

  toggleMic() {
    this.audioTrack.setEnabled(this.isMicMuted);
    this.agoraRTCStreamHandler.toggleMic(this.isMicMuted);
    this.isMicMuted = !this.isMicMuted;
    this.localStorageService.addItem("micMuted", JSON.stringify(this.isMicMuted));
    this.agoraRTCStreamHandler.isMicMuted=this.isMicMuted;
  }

  async updateSelectedMediaDevices(deviceInfo) {
    if (deviceInfo.kind === "audioinput") {
      this.audioTrack = await this.agoraRTCStreamHandler.testAudioDevice();
    } else if (deviceInfo.kind === "videoinput") {
      // stop already running media and replay again
      this.videoTrack = await this.agoraRTCStreamHandler.testVideoDevice();
    }
    this.agoraRTCStreamHandler.updateSelectedMediaDevices(deviceInfo);
  }

  ngOnDestroy() {
    this.castMediaDevicesSubscription?.unsubscribe();
    this.castSpeakingVolumeSubscription?.unsubscribe();

    // apply selected devices to media tracks
    this.agoraRTCStreamHandler.applyMediaDeviceChange();
    // destroy local testing media tracks
    this.videoTrack?.close();
    this.audioTrack?.close();
    // // play local stream if it was moderator view at event dashaboard page
    // this.agoraRTCStreamHandler.playLocalStream(
    //   `${this.user.user_id}-local_stream`
    // );
  }
}
