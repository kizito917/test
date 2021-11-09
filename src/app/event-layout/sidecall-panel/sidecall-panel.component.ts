import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";

import {
  EventService,
  AgoraRtcSidecallHandlerService,
  EventSocketService,
  AgoraRtcStreamHandlerService,
  BroadcastStreamingContent,
} from "src/app/shared";
import { ToastrService } from "ngx-toastr";
import { HttpErrorResponse } from "@angular/common/http";
import { Subscription } from "rxjs";

@Component({
  selector: "app-sidecall-panel",
  templateUrl: "./sidecall-panel.component.html",
  styleUrls: ["./sidecall-panel.component.scss"],
})
export class SidecallPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() calleInfo: any;
  @Input() user_id: string;
  @Input() event_id: string;
  @Input() room: any = {};
  @Input() eventParticipants: any;
  @Output() onSideCallAudioBalancerChange = new EventEmitter<{}>();

  public audioSideCallVolume: number = 15;
  public mediaVolume: number;
  public audioVolume: number;
  public users: any = [];
  public serverError: any = null;
  public genericError = "service is not available. please try again later.";

  public roomConnectFlag = {
    calling: "calling",
    joining: "joining",
  };

  public current_invition_flag = "calling";
  public is_someone_joining = false;
  public room_interval: any;
  public timer: number = 10;
  public tempAudio: number;
  public remoteUsers = [];
  public localStream = null;
  public isCameraMute = false;
  public lockLoading: boolean = false;
  public endCallLoading: boolean = false;
  public isUnMuted: boolean = true;
  private activeEventState: any = { data: {} };
  public readyForLiveScene: boolean = false;
  sidecallUpdateRemoteUserSubscription: Subscription;
  localStreamSubscription: Subscription;

  // joinRoomSubscription: Subscription;
  listenSideCallTimeoutSubscription: Subscription;
  listenCallAcceptedSubscription: Subscription;
  listenCallDeclineSubscription: Subscription;

  constructor(
    private eventService: EventService,
    private toastr: ToastrService,
    public AgoraSideCallService: AgoraRtcSidecallHandlerService,
    public AgoraRTCStreamService: AgoraRtcStreamHandlerService,
    private eventSocketService: EventSocketService
  ) {
    this.sidecallUpdateRemoteUserSubscription =
      this.AgoraSideCallService.subscrtiptionUpdateRemoteUsers.subscribe(
        (data) => {
          this.remoteUsers = [...this.AgoraSideCallService.remoteStreams];
          // this.AgoraSideCallService.setRemoteStreamVolume(this.audioSideCallVolume);
        }
      );

    this.localStreamSubscription =
      this.AgoraSideCallService.castLocalStreamPublished.subscribe((data) => {
        this.localStream = data;
      });

    this.AgoraRTCStreamService.castLiveMediaStateUpdate.subscribe(
      (data: BroadcastStreamingContent) => {
        if (data) {
          this.activeEventState = {
            ...this.AgoraRTCStreamService.activeEventState,
          };
          if (
            this.activeEventState?.data?.mediaVolume &&
            this.AgoraSideCallService.sidecallRoom
          ) {
            this.setLocalAndMediaVolume();
          }
          if (this.activeEventState?.data?.liveQnAOpenState) {
            this.readyForLiveScene = true;
          } else {
            this.readyForLiveScene = false;
          }
        }
      }
    );
  }

  ngOnInit(): void {
    this.AgoraSideCallService.eventParticipants = this.eventParticipants;
    if (!this.AgoraSideCallService.currentReciever) this.startCall(); // This is called at receiver end
    // this.eventSocketService.connect().subscribe((x) => {
    //   //console.log('event socket connected.', x);
    // });

    // this.joinRoomSubscription = this.eventSocketService
    //   .joinRoom(this.user_id)
    //   .subscribe((message) => {
    //     console.log("user socket join.", message);
    //   });

    this.listenSideCallTimeoutSubscription = this.eventSocketService
      .listenSideCallTimeout()
      .subscribe((response) => {
        console.log("message from socket server ====>", response);
        if (
          response &&
          response.sender_id == this.user_id &&
          response?.sidechat_call?.endTime
        ) {
          this.toastr.error(response.message, "Error");
          this.handleCallFailureFromReciever();
        }
      });

    this.listenCallAcceptedSubscription = this.eventSocketService
      .listenCallAccepted()
      .subscribe(async (response) => {
        console.log("message from socket server ====>", response);
        if (response && response.sender_id == this.user_id) {
          this.room = response.sidechat_call;
          //this.toastr.success(response.message, "Success");
          this.is_someone_joining = false;
          this.cleanInterval();
          // check if I am already not in call then join channel publish stream
          if (!this.AgoraSideCallService.isPublish) await this.startCall(); // this is called for sender(fresh call, join existing call)

          this.AgoraSideCallService.extandSidecall(this.room);
        }
      });

    this.listenCallDeclineSubscription = this.eventSocketService
      .listenCallDecline()
      .subscribe((response) => {
        console.log("message from socket server ====>", response);
        if (response && response.sender_id == this.user_id) {
          this.toastr.error(response.message, "Error");
          this.handleCallFailureFromReciever();
        }
      });
    this.setLocalAndMediaVolume();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.calleInfo && changes.calleInfo.currentValue) {
      this.openJoiningPanel();
    }
    if (changes?.eventParticipants?.currentValue) {
      this.AgoraSideCallService.eventParticipants = this.eventParticipants;
    }

    if (changes?.room) {
      this.room = changes.room?.currentValue || {};
      if (this.room.callStatus == 2) {
        this.AgoraSideCallService.leaveChannel();
        this.AgoraSideCallService.endSideCall();
      }
    }
  }

  async ngOnDestroy() {
    this.mediaVolume = this.activeEventState.data?.mediaVolume;
    this.audioVolume = 100;
    this.handleLiveMediaAudio();
    this.cleanInterval();
    this.sidecallUpdateRemoteUserSubscription.unsubscribe();
    this.localStreamSubscription.unsubscribe();
    this.is_someone_joining = false;
    // this.eventSocketService.leaveRoom(this.user_id);

    // this.joinRoomSubscription.unsubscribe();
    this.listenSideCallTimeoutSubscription.unsubscribe();
    this.listenCallAcceptedSubscription.unsubscribe();
    this.listenCallDeclineSubscription.unsubscribe();

    // leave the call when switching from side call to main scene
    if (this.AgoraSideCallService.isPublish) await this.leaveCall();
  }

  async startCall() {
    try {
      if (this.room?.callStatus === 1) {
        await this.AgoraSideCallService.init(
          false,
          this.user_id,
          this.room.code
        );
        await this.AgoraSideCallService.publishLocalStream();
        await this.AgoraRTCStreamService.toggleCamera(true);
        await this.AgoraRTCStreamService.toggleMic(true);
      }
    } catch (err) {
      console.warn(err);
    }
  }

  async leaveCall() {
    this.endCallLoading = true;
    try {
      if (this.room_interval) {
        this.cleanInterval();
        this.room_interval = null;
      }
      await this.AgoraSideCallService.leaveChannel();
      if (this.room.callStatus === 0) return this.cancelSideChatCall();
      else return this.leaveSideChatCall();
    } catch (err) {
      console.warn(err);
    }
  }

  cancelSideChatCall() {
    this.eventService
      .cancelSideChatCall({
        sidechat_call_id: this.room.sidechatCallId,
      })
      .subscribe(
        (response: any) => {
          console.log(response);
          if (response && response.is_success) {
            this.localStream = null;
            this.remoteUsers = [];
            this.AgoraSideCallService.endSideCall();
            //this.toastr.success(response.message, "Success");
          } else {
            this.toastr.error(response.message, "Error");
          }
        },
        (err: HttpErrorResponse) => {
          this.AgoraSideCallService.endSideCall();
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
  }

  leaveSideChatCall() {
    this.eventService
      .endSideChatCall({
        sidechat_call_id: this.room.sidechatCallId,
      })
      .subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.localStream = null;
            this.remoteUsers = [];
            this.AgoraSideCallService.endSideCall();
            //this.toastr.success(response.message, "Success");
          } else {
            this.toastr.error(response.message, "Error");
          }
          this.endCallLoading = false;
        },
        (err: HttpErrorResponse) => {
          this.AgoraSideCallService.endSideCall();
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
          this.endCallLoading = false;
        }
      );
  }

  async handleCameraMute() {
    const flag = this.isCameraMute;
    await this.AgoraSideCallService.toggleCamera(flag);
    this.isCameraMute = !this.isCameraMute;
  }

  startInterval() {
    this.timer = 10;
    if (this.room_interval) return;
    this.room_interval = setInterval(() => {
      this.timer -= 1;
      if (this.timer === -1) {
        this.cleanInterval();
        this.room_interval = null;
        this.is_someone_joining = false;
        this.timer = 10;
        // check if the callStatus is 0 then cancel the side call
        if (this.room.callStatus === 0 || !this.localStream) {
          this.leaveCall();
        }
      }
    }, 1000);
  }

  cleanInterval() {
    clearInterval(this.room_interval);
    this.room_interval = null;
    this.timer = 10;
  }

  openJoiningPanel() {
    this.is_someone_joining = true;
    this.startInterval();
  }

  async handleCallFailureFromReciever() {
    this.is_someone_joining = false;
    if (!this.remoteUsers.length) {
      this.localStream = null;
      this.remoteUsers = [];
      await this.AgoraSideCallService.leaveChannel();
      this.AgoraSideCallService.endSideCall();
    }
  }

  async lockSideChatRoom() {
    this.lockLoading = true;
    const isLocked = !this.room.isLocked;
    this.eventService
      .lockSideChatCall({
        sidechat_call_id: this.room.sidechatCallId,
        lock_sidechat_call: isLocked,
      })
      .subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.room = response?.data?.sidechat_call;
            //this.toastr.success(response.message, "Success");
          } else {
            this.toastr.error(response.message, "Error");
          }
          this.lockLoading = false;
        },
        (err: HttpErrorResponse) => {
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
          this.lockLoading = false;
        }
      );
  }

  audioChangeHandler(event = null) {
    const volume = +event.target.value;
    this.audioSideCallVolume = volume;
    this.isUnMuted=true;
    this.setLocalAndMediaVolume();
  }

  // set remote and live media volume
  setLocalAndMediaVolume() {
    const volume = this.audioSideCallVolume;
    // this.AgoraSideCallService.setRemoteStreamVolume(volume);
    this.calculateMediaVolume(volume);
  }

  //calculate live media volume & handle it: when user in sidecall
  calculateMediaVolume(volume) {
    const mediaVolumeFromModerator = this.activeEventState.data?.mediaVolume;
    // const audioVolumeFromModertor = this.activeEventState.data?.audioCommantryVolume;
    this.mediaVolume = Math.floor((mediaVolumeFromModerator * volume) / 100);
    this.audioVolume = volume;
    this.handleLiveMediaAudio();
  }

  //handle live media volume according to type
  handleLiveMediaAudio() {
    const contentTypeMiddle = this.activeEventState?.data?.contentType;
    this.AgoraSideCallService.setOnAirUserVolume(this.audioVolume);
    this.AgoraRTCStreamService.setAudioCommentryUsersVolume(this.audioVolume);
    if (contentTypeMiddle?.indexOf("externalMedia") !== -1) {
      this.AgoraRTCStreamService.setLocalYoutubeVolume(this.mediaVolume);
    }
  }

  setMuteOrUnmute(){
    if(this.isUnMuted){
      this.tempAudio=this.audioSideCallVolume;
      this.audioSideCallVolume=0;
      this.isUnMuted=false;
      this.setLocalAndMediaVolume();
    }
    else{
      this.audioSideCallVolume=this.tempAudio;
      this.isUnMuted=true;
      this.setLocalAndMediaVolume();
    }
  }
}
