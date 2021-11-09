import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  ViewEncapsulation,
  HostListener,
} from "@angular/core";
import { YoutubePlayerInterface } from "../../interfaces/youtube-player.interface";
import {
  AgoraRtcStreamHandlerService,
  BroadcastStreamingContent,
  DashboardViewEnum,
  EventSocketService,
  EventStreamContentEnum,
  extractYoutubeCode,
  RoleEnum,
} from "src/app/shared";
import { Subscription } from "rxjs";
@Component({
  selector: "app-youtube-player",
  templateUrl: "./youtube-player.component.html",
  styleUrls: ["./youtube-player.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class YoutubePlayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() youtubePlayerConfig: YoutubePlayerInterface = {
    videoId: "",

    playerVars: { autoplay: 1, mute: true, rel: 0 },
  };

  @Input() renderPos: number;
  @Input() viewState: number;
  @Output() onYoutubeMediaClick = new EventEmitter<BroadcastStreamingContent>();
  public YTPlayerState = {
    NOT_STARTED: -1,
    ENDED: 0,
    STARTED: 1,
    PAUSED: 2,
    SEEKED: 6,
  };

  private _YTPlayer;
  castLiveMediaStateSubscription: Subscription;
  private elapsedTimeUpdateInterval;
  private activeEventState: any = { data: {} };
  private initialRender: boolean = true;
  private attendeePlayPauseAction = this.YTPlayerState.PAUSED;
  private renderPosSwitch = false;
  private currentMediaVolume = 100;
  handlerRole: number;
  prevAction: number = 2;
  videoState;
  private prevElapsedTime = -1;
  private isElapsedTimeSet = false;
  showLoader: boolean = true;
  youtubeMedia: boolean;
  videoID: string;
  error_message = "";
  htmlPlayerActivate: boolean = false;
  upcomingType: string;

  constructor(public agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {
    this.handlerRole = this.agoraRTCStreamHandler.handlerRole;
  }

  ngOnInit(): void {
    //  if (this.renderTo === "middle") {
    this.castLiveMediaStateSubscription =
      this.agoraRTCStreamHandler.castLiveMediaStateUpdate.subscribe(
        (data: BroadcastStreamingContent) => {
          if (data) {
            this.activeEventState = {
              ...this.agoraRTCStreamHandler.activeEventState,
            };

            // if active media type is not external media then return
            if (
              this.activeEventState?.data.contentType?.indexOf(
                "externalMedia"
              ) === -1
            )
              return;
            
            this.prevElapsedTime = this.videoState?.elapsedTime;
            this.videoState =
              this.activeEventState?.data[this.activeEventState?.data?.media];
            console.log("madhur-aemit", this.videoState);
            this.checkForMediaUpdate();
            // set media volume if it exist
            const inComingVolume = this.activeEventState.data?.mediaVolume;
            if (
              typeof inComingVolume !== "undefined" &&
              this.currentMediaVolume !== inComingVolume
            ) {
              this.currentMediaVolume = inComingVolume;
              this.setVolume(this.currentMediaVolume);
            }
          }
        }
      );
    // }
    this.agoraRTCStreamHandler.castLiveMediaStateUpdateBySideCall.subscribe(
      (mediaVolume) => {
        this?._YTPlayer?.setVolume(mediaVolume);
      }
    );
    // extracting other media url
    this.videoID = this.youtubePlayerConfig?.videoId.split("#")[0];
    let types;
    console.log(this.videoID, "iddd");
    types = ["mp3", "mp4", "webm", "hls", "m3u8"];
    let array = this.videoID.split(".");
    console.log(array, "array");
    this.upcomingType = array[array.length - 1];
    // this.videoID
    //   .slice(this.videoID.length - 3, this.videoID.length)
    if (types.includes(this.upcomingType.toLowerCase())) {
      this.youtubeMedia = false;
      this.videoID = this.videoID.replace('"', "");
    } else {
      this.youtubeMedia = true;
    }
  }

  checkForMediaUpdate() {
    // update youtube config params
    this.updateYoutubeParams();
    if (!this.initialRender) 
    // setTimeout(() => {
      this.handleLiveEventStateChange();
    // }, 200);
  }

  async handleLiveEventStateChange() {
    try {
      if (this._YTPlayer && this.isActivePos() && this.videoState.action!==this.YTPlayerState.SEEKED) {
        if (
          this.videoState.action === this.YTPlayerState.PAUSED ||
          (!this.isActivePos() && this.renderPosSwitch)
        ) {
          if (!this.initialRender && !this.renderPosSwitch) this.pauseVideo();
          else this.setElapsedTime(this.videoState.elapsedTime);
        } else if (
          this.videoState.updateRemoteMedia ||
          this.initialRender ||
          this.renderPosSwitch
        ) {
          // console.log(this.activeEventState, "activeEventState");
          // this.handleLiveEventStateChange();

          this.setElapsedTime(
            this.videoState.elapsedTime + (this.renderPosSwitch ? 1 : 0)
          );
          this.playVideo();
        }
        console.log(this.videoState, "madhur-lchange");
      }
      else{
        this.pauseVideo();
      }
    } catch (err) {}
  }

  updateYoutubeParams() {
    if (!this.initialRender) return;
    this.youtubePlayerConfig.videoId = `${this.activeEventState?.data?.media}`;
    this.youtubePlayerConfig.playerVars.autoplay = 1;
    if (
      !this.isActivePos() ||
      this.videoState?.action === this.YTPlayerState.PAUSED
    ) {
      this.youtubePlayerConfig.playerVars.autoplay = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.viewState && !changes.viewState.firstChange) {
      this.renderPosSwitch = true;
      this.handleLiveEventStateChange();
      this.renderPosSwitch = false;
    }
  }

  async handlePlayerReady(YTPlayer) {
    // await timeout(2000);
    this.showLoader = false;

    this._YTPlayer = YTPlayer.target;
    // set the elapsedTime
    this.setElapsedTime(this.videoState?.elapsedTime);
    this.handleLiveEventStateChange();

    if (this.handlerRole === RoleEnum.MODERATOR && this.isActivePos()) {
      this.activateRealTimeState();
      // this.playVideo();
    }
    this.initialRender = false;
    // check if video action
    if (!this.htmlPlayerActivate) this?._YTPlayer?.unMute();
    // this.htmlPlayerActivate = false;
  }

  //HTML player ready
  htmlPlayerReady(data) {
    this.htmlPlayerActivate = true;

    // creating functions
    data.playVideo = () => {
      this._YTPlayer.target.play();
      // console.log(this._YTPlayer,this.renderPos,this.viewState,"Play2");
    };

    data.seekTo = (elapsedTime, data) => {
      if (data) 
      this._YTPlayer.target.currentTime = elapsedTime;
    };

    data.getCurrentTime = () => {
      return this._YTPlayer.target.currentTime;
    };

    data.setVolume = (volume) => {
      let volumeSet = volume / 100;
      this._YTPlayer.target.volume = volumeSet;
    };

    data.pauseVideo = () => {
      this._YTPlayer.target.pause();
      // console.log(this._YTPlayer,this.renderPos,this.viewState,"Pause2");
    };

    console.log("EMITTING DATA", data);
    this.handlePlayerReady({ target: data });
  }

  handleStateChange(YTPlayer) {
    if (!this.isActivePos()) return;

    if(this.htmlPlayerActivate){
      this._YTPlayer.playerInfo = {};
      this._YTPlayer.playerInfo.playerState = YTPlayer.data;
    }
    if (Math.abs(this.prevElapsedTime - this._YTPlayer.getCurrentTime()) >1.5){
      YTPlayer.data = 6;
    }
    // this._YTPlayer.playerInfo.playerState = YTPlayer.data;
    if (this.handlerRole === RoleEnum.MODERATOR) {
      if (YTPlayer.data === this.YTPlayerState.PAUSED) {
        this.emitData(this.YTPlayerState.PAUSED);
        this.deActivateRealTimeState();
      } else if (YTPlayer.data === this.YTPlayerState.STARTED) {
        this.emitData(this.YTPlayerState.STARTED);
        this.activateRealTimeState();
      } else if (YTPlayer.data === this.YTPlayerState.ENDED) {
        this.deActivateRealTimeState();
        this.emitData(this.YTPlayerState.PAUSED);
      }
      else if(YTPlayer.data===6)
        this.emitData(YTPlayer.data);
    } else if (this.handlerRole === RoleEnum.ATTENDEE) {
      if (
        (YTPlayer.data === this.YTPlayerState.PAUSED ||
          YTPlayer.data === this.YTPlayerState.STARTED) &&
        this.attendeePlayPauseAction !== YTPlayer.data
      ) {
        if (this.videoState) {
          // this.setElapsedTime(this.videoState.elapsedTime);
          if (this.videoState.action === this.YTPlayerState.PAUSED || this.videoState.action === this.YTPlayerState.SEEKED)
            this.pauseVideo();
        }

        this.attendeePlayPauseAction = YTPlayer.data;
      }
    }
    // this.htmlPlayerActivate = false;
  }

  //HTML State Change
  htmlPlayerStateChange(event) {
    this.htmlPlayerActivate = true;
    let player = {};
    player["data"] = event.data;
    console.log("Emitting data", player);
    this.handleStateChange(player);
  }

  setElapsedTime(elapsedTime = this._YTPlayer.getCurrentTime()) {
    if (
      (((this.videoState?.action === this.YTPlayerState.PAUSED 
        || this.videoState?.action === this.YTPlayerState.SEEKED) &&
        !this.isElapsedTimeSet &&
        elapsedTime > this.prevElapsedTime) ||
        this.renderPosSwitch ||
        this.initialRender) &&
      this.isActivePos()
    ) {
      console.log(elapsedTime, "madhur-setelapsedTime");
      this._YTPlayer?.seekTo(elapsedTime, true);
      this.isElapsedTimeSet = true;
    }
  }

  // when youtube video is loaded first time
  playVideo() {
    this.setVolume(this.currentMediaVolume);
    // check pause status first
    if (
      this.isActivePos() &&
      this.videoState.action === this.YTPlayerState.STARTED
    )
      this._YTPlayer.playVideo();
    else this.pauseVideo();
  }

  pauseVideo() {
    this.isElapsedTimeSet = false;
    this.setElapsedTime(this.videoState.elapsedTime);
    this._YTPlayer.pauseVideo();
  }

  isActivePos() {
    // if video is not playing in active container then pause the video
    if (this.renderPos === this.viewState) {
      return true;
    }
    return false;
  }
  endVideo() {
    this._YTPlayer.endVideo();
  }

  emitData(action, updateRemoteMedia = true) {
    // check if moderator has paused the video then broadcast the event to channel
    if (this.handlerRole === RoleEnum.MODERATOR && this.isActivePos()) {
      console.log(this._YTPlayer?.getCurrentTime(),action, "madhur");

      // console.log(this.youtubePlayerConfig.videoId, "dinesh mangal");
      this.onYoutubeMediaClick.emit({
        event_id: this.activeEventState.event_id,
        data: {
          type: EventStreamContentEnum.YOUTUBE_STREAM_TYPE,
          [this.youtubePlayerConfig.videoId]: {
            action,
            updateRemoteMedia,
            elapsedTime: this._YTPlayer.getCurrentTime(),
          },
        },
      });
      this.prevAction = action;
    }
  }

  activateRealTimeState() {
    if (this.handlerRole === RoleEnum.MODERATOR && this.isActivePos()) {
      clearInterval(this.elapsedTimeUpdateInterval);
      this.elapsedTimeUpdateInterval = setInterval(() => {
        if (
          this._YTPlayer?.playerInfo?.playerState === this.YTPlayerState.STARTED
        )
          this.emitData(this._YTPlayer.playerInfo.playerState, false);
      }, 1000);
    }
  }

  deActivateRealTimeState() {
    clearInterval(this.elapsedTimeUpdateInterval);
  }

  setVolume(volume: number) {
    // this?._YTPlayer?.unMute();
    this?._YTPlayer?.setVolume(volume);
  }

  @HostListener("window:beforeunload", ["$event"])
  beforeUnloadHandler(event: any) {
    event.preventDefault();
    // emit latest youtube video state
    if (this._YTPlayer.playerInfo.playerState === this.YTPlayerState.STARTED)
      this.emitData(this._YTPlayer.playerInfo.playerState, false);
  }

  async htmlPlayerSeeked(YTPlayer){
    if(Math.abs(this.prevElapsedTime - this._YTPlayer.getCurrentTime())>1.5)
      this.emitData(YTPlayer.data);
  }

  ngOnDestroy() {
    clearInterval(this.elapsedTimeUpdateInterval);
    this.castLiveMediaStateSubscription?.unsubscribe();
    this.initialRender = true;
    this.htmlPlayerActivate = false;
  }
}
