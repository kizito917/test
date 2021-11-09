import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  AgoraMediaStream,
  AgoraRtcStreamHandlerService,
  DashboardViewEnum,
  STREAMSLAYOUT,
  timeout,
} from "src/app/shared";

@Component({
  selector: "app-play-media",
  templateUrl: "./play-media.component.html",
  styleUrls: ["./play-media.component.scss"],
})
export class PlayMediaComponent implements OnInit, AfterViewInit {
  @Input() stream: AgoraMediaStream;
  @Input() totalStreams: number;
  @Input() streamIndex: number;
  @Input() viewState: number;
  @Input() primaryMedia: boolean = true;
  @Input() renderPos: number;
  isVideoMuted: boolean = false;
  castTriggerLiveStreamActionSubscription: Subscription;
  eleExistCheckInterval;
  streamWrapperStyle = {};
  constructor(public agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {}

  ngOnInit(): void {
    this.agoraRTCStreamHandler.castFullScreenHandler.subscribe((data) => {
      this.getMediaStyle();
    });
    this.castTriggerLiveStreamActionSubscription =
      this.agoraRTCStreamHandler.castTriggerLiveStreamAction.subscribe(
        (data) => {
          switch (data.type) {
            case "cameraMuted": {
              // if camera is muted then broadcast that message to channel
              this.checkVideoMuted();
              this.getMediaStyle();
            }
          }
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    // changes.prop contains the old and the new value...
    //console.log('ngOnChanges =======>>>>>', changes);
    // if (!changes?.stream || changes?.stream.firstChange) return;
    this.playMedia();
    this.checkVideoMuted();
    this.getMediaStyle();
  }

  getMediaStyle() {
    if (this.primaryMedia) {
      this.streamWrapperStyle = this.getPrimaryMediaStyle();
    } else {
      this.streamWrapperStyle = this.getSecondaryMediaStyle();
    }

    // if view state is in left side then subscribe to low resolution stream;
    if (this.viewState === 2 || this.viewState === 3) {
      this.agoraRTCStreamHandler.setRemoteStreamType([this.stream]);
    } else if (
      this.agoraRTCStreamHandler?.activeEventState?.data?.contentType ===
      "agora"
    ) {
      this.agoraRTCStreamHandler.setRemoteStreamType(
        [this.stream],
        this.primaryMedia ? "high" : "low"
      );
    }
  }

  getPrimaryMediaStyle = (): any => {
    return {};
  };

  getSecondaryMediaStyle() {
    const style = { width: "150px", height: "150px" };
    if (this.streamIndex === 0) {
      if (this.totalStreams === 6) {
        style["margin-left"] = "35%";
      } else if (this.totalStreams === 7) {
        style["margin-left"] = "-35%";
      } else if (this.totalStreams === 8) {
        style["margin-left"] = "16%";
      }
    } else if (this.streamIndex === 1) {
      style["margin-left"] = "-16%";
    }
    if(this.agoraRTCStreamHandler.handlerRole===3 &&
       this.viewState==4 && screen.width<1400){
      style["width"] = "100px";
      style["height"] = "100px";
    }
    if (this.viewState == 2 || this.viewState == 3) {
      if(screen.width<1400){
        style["width"] = "50px";
        style["height"] = "50px";
      }
      else{
        style["width"] = "75px";
        style["height"] = "75px";
      }
    }

    if (this.agoraRTCStreamHandler.isFullScreenActive) {
      style["width"] = "250px";
      style["height"] = "250px";
    }

    console.log(this.viewState, "viewState");
    console.log(style);
    return style;
  }

  async checkVideoMuted() {
    let videoMuted = this.stream?.isVideoMuted;
    if (
      this.agoraRTCStreamHandler.userDetails.user_id === this.stream?.userId
    ) {
      videoMuted = this.agoraRTCStreamHandler.isCameraMuted;
    }

    this.isVideoMuted = videoMuted;
  }

  async playMedia() {
    // play the stream only in visible container
    if (
      this.renderPos === this.viewState ||
      (this.renderPos === DashboardViewEnum.NONE &&
        this.viewState === DashboardViewEnum.CHAT_ONLY)
    ) {
      try {
        let ele = document.getElementById(
          `${this.stream.userId}-video_streaming-${this.renderPos}`
        );
        if (ele) {
          // await this.stopMedia();
          ele.innerHTML = "";
          if (!this.stream.isVideoMuted) {
            // await timeout(10);
            const playresp = this.stream.play(
              `${this.stream.userId}-video_streaming-${this.renderPos}`
            );
            console.log(playresp, "play start");
          }
        }
      } catch (err) {
        console.log(
          err,
          "error in playing string ID = " +
            `${this.stream.userId}-video_streaming-${this.renderPos}`
        );
      }
    } else {
      // await this.stopMedia();
    }
  }

  async stopMedia() {
    //  return this.stream.stop();
  }

  ngAfterViewInit() {
    this.eleExistCheckInterval = setInterval(() => {
      let ele = document.getElementById(
        `${this.stream.userId}-video_streaming-${this.renderPos}`
      );
      if (ele) {
        this.playMedia();
        clearInterval(this.eleExistCheckInterval);
      }
    }, 50);
  }

  ngOnDestroy() {
    clearInterval(this.eleExistCheckInterval);
    this.castTriggerLiveStreamActionSubscription.unsubscribe();
  }
}
