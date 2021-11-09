import {
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Component, Input, OnInit, OnChanges } from "@angular/core";
import { Subscription } from "rxjs";
import {
  AgoraRtcSidecallHandlerService,
  AgoraRtcStreamHandlerService,
  BroadcastStreamingContent,
  RoleEnum,
} from "src/app/shared";
import { YoutubePlayerInterface } from "src/app/shared/interfaces/youtube-player.interface";

@Component({
  selector: "app-live-media-renderer",
  templateUrl: "./live-media-renderer.component.html",
  styleUrls: ["./live-media-renderer.component.scss"],
})
export class LiveMediaRendererComponent
  implements OnInit, OnChanges, OnDestroy
{
  media = "/assets/image/default-stream@2x.png";
  mediaType = "";

  public selectedOverlay: string;
  public attendeeCardPosition: any;
  public selectedBackground: string;
  @Input() eventId = "";
  @Input() viewState: number;
  @Input() handlerRole: number;
  @Input() renderPos: string;
  @Output() onMediaClick = new EventEmitter<BroadcastStreamingContent>();
  public youtubeMediaType = ""; //will be creating unique media type by it's type and media id
  public youtubePlayerConfig: YoutubePlayerInterface = {
    videoId: "",
    playerVars: { autoplay: 1, mute: false, controls: 1, disablekb: 0 },
  };

  castLiveMediaStateSubscription: Subscription;
  timeoutRef: any;
  showHover: boolean = true;
  hoverTimeoutRef: any;
  moderatorWithCommentry: boolean;
  attendeeWithCommentry: boolean;

  constructor(
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    public agoraSideCallService: AgoraRtcSidecallHandlerService
  ) {}

  ngOnInit(): void {
    this.castLiveMediaStateSubscription =
      this.agoraRTCStreamHandler.castLiveMediaStateUpdate.subscribe(
        (data: BroadcastStreamingContent) => {
          if (data) {
            if (!this.timeoutRef) {
              this.timeoutRef = setTimeout(() => {
                this.handleLiveEventStateChange();
                this.timeoutRef = 0;
              }, 500);
            }

            // if (data.data.contentType === "externalMedia")
            //   this.handleYoutubeMedia();
          }
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventId || changes.viewState) {
      this.handleLiveEventStateChange();
    }
    // if (this.mediaType === "externalMedia") this.handleYoutubeMedia();
  }

  handleLiveEventStateChange() {
    const activeEventState = this.agoraRTCStreamHandler.activeEventState;
    const oldMedia = this.media;
    if (activeEventState.event_id === this.eventId) {
      this.selectedBackground = activeEventState.data?.selectedBackground;
      this.selectedOverlay = activeEventState.data?.selectedOverlay;
      this.media = activeEventState.data?.media;
      this.mediaType = activeEventState.data?.contentType;
      this.moderatorWithCommentry=activeEventState.data?.moderatorWithCommentry;
      this.attendeeWithCommentry= activeEventState.data?.attendeeWithCommentry;
    }

    // check if media type is youtube and media is changed
    if (
      this.mediaType?.indexOf("externalMedia") !== -1 &&
      oldMedia !== this.media
    ) {
      console.log("oldMedia ", oldMedia);
      this.handleYoutubeMedia();
    }
  }

  handleYoutubeMedia() {
    if (this.handlerRole === RoleEnum.ATTENDEE) {
      this.youtubePlayerConfig.playerVars.controls = 0;
      this.youtubePlayerConfig.playerVars.disablekb = 1;
    }
    console.log("youtubetype uper ", this.youtubeMediaType);
    setTimeout(() => {
      this.youtubeMediaType = `${this.media}`;
      console.log("youtubetype ", this.youtubeMediaType);
    }, 0);
    this.youtubeMediaType = "";
  }

  handleYoutubeMediaClick(data) {
    this.onMediaClick.emit(data);
  }

  getOnAirBG() {
    return this.selectedBackground || "/assets/image/default-stream@2x.png";
  }

  // fullScreenHandler() {
  //   this.agoraRTCStreamHandler.handleFullScreen();
  // }
  fullScreenHandler() {
    this.agoraRTCStreamHandler.handleFullScreen();
  }
  @HostListener("document:keydown.escape", ["$event"])
  handleExitFullScreen(event: KeyboardEvent) {
    let x = event.keyCode;
    if (x === 27) {
      this.agoraRTCStreamHandler.isFullScreenActive = false;
    }
  }

  handleHOVER() {
    this.showHover = true;
    clearTimeout(this.hoverTimeoutRef);
    this.hoverTimeoutRef = setTimeout(() => {
      this.showHover = false;
    }, 5000);
  }

  ngOnDestroy() {
    this.castLiveMediaStateSubscription?.unsubscribe();
  }
}
