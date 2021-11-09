import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  OnDestroy,
  Input,
} from "@angular/core";
import { Subscription } from "rxjs";
import { BroadcastStreamingContent } from "../../interfaces/broadcast-streaming-content.interface";
import { AgoraRtcStreamHandlerService } from "../../services/agora/agora-rtc-stream-handler.service";

@Component({
  selector: "app-audio-balancer",
  templateUrl: "./audio-balancer.component.html",
  styleUrls: ["./audio-balancer.component.scss"],
})
export class AudioBalancerComponent implements OnInit, OnDestroy {
  @Input() moderatorAudio: boolean;
  @Input() moderatorVideo: boolean;
  @Input() attendeeAudio: boolean;
  @Input() attendeeVideo: boolean;
  @Output() onAudioBalancerChange = new EventEmitter<{}>();
  castLiveMediaStateSubscription: Subscription;
  private activeEventState: any = { data: {} };

  mediaVolume: number = 100;
  isVolumeByCommentry: boolean = false;
  bubble;
  contentType;
  timeoutRef: ReturnType<typeof setTimeout>;

  constructor(public agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {}

  ngOnInit(): void {
    this.castLiveMediaStateSubscription =
      this.agoraRTCStreamHandler.castLiveMediaStateUpdate.subscribe(
        (data: BroadcastStreamingContent) => {
          if (data) {
            this.activeEventState = {
              ...this.agoraRTCStreamHandler.activeEventState,
            };
            if (
              this.activeEventState?.data.contentType?.indexOf(
                "externalMedia"
              ) !== -1
            )
              this.setLiveSceneVolume();
            if (
              this.contentType &&
              this.contentType !== this.activeEventState?.data?.contentType
            ) {
              this.contentType = null;
            }
          }
        }
      );
  }

  // real time updates when user move the slider
  audioChangeHandler(event = null) {
    const volume = +event.target.value;
    const mediaVolume = volume;
    // const audioCommantryVolume = 100;
    this.mediaVolume = volume;
    this.contentType = this.activeEventState?.data?.contentType;

    // update existing event state
    this.agoraRTCStreamHandler.setLocalYoutubeVolume(mediaVolume);
    //set bubble position
    this.setBubblePosition();
  }

  // This is called when user release the slider
  audioChangeReleaseHandler(event = null) {
    const volume = +event.target.value;
    const mediaVolume = volume;
    // broadcast these data
    this.onAudioBalancerChange.emit({
      mediaVolume,
    });
  }
  setLiveSceneVolume() {
    // get the current volume state of media and audio commantory
    const activeEventState = this.agoraRTCStreamHandler.activeEventState.data;
    const contentTypeMiddle = this.activeEventState?.data?.contentType;

    if (!activeEventState) return;
    if (contentTypeMiddle !== this.contentType) {
      // get default volume state
      const defaultVolumeState = this.getDefaultAudioVolume();
      let updateVolumeState = {
        mediaVolume: defaultVolumeState.mediaVolume,
      };
      this.mediaVolume = updateVolumeState.mediaVolume;
      this.setActiveEventData(updateVolumeState);
      //set bubble position
      this.setBubblePosition();
    }
  }

  getDefaultAudioVolume() {
    let mediaVolume = 0;
    //check what media is currently active
    if (this.moderatorAudio || this.moderatorVideo || this.attendeeAudio || this.attendeeVideo) {
      mediaVolume = 15;
    } else {
      mediaVolume = 100;
    }
    this.mediaVolume = mediaVolume;
    return {
      mediaVolume,
    };
  }

  setActiveEventData(data) {
    this.agoraRTCStreamHandler.setActiveEventState(
      {
        event_id: this.activeEventState.event_id,
        data: data,
      },
      false
    );
  }

  setBubblePosition() {
    this.bubble = document.getElementsByClassName(
      "bubble"
    ) as HTMLCollectionOf<HTMLElement>;
    this.bubble[0].style.left = `calc(${this.mediaVolume}% + (${
      73 - this.mediaVolume * 1.16
    }px))`;
  }

  setVolumeToMute() {
    let updateVolumeState = {
      mediaVolume: 0,
    };
    this.contentType = this.activeEventState?.data?.contentType;
    this.mediaVolume = 0;
    this.setActiveEventData(updateVolumeState);
    this.setBubblePosition();
  }

  setVolumeToMax() {
    let updateVolumeState = {
      mediaVolume: 100,
    };
    this.contentType = this.activeEventState?.data?.contentType;
    this.mediaVolume = 100;
    this.setActiveEventData(updateVolumeState);
    this.setBubblePosition();
  }
  ngOnDestroy() {
    this.castLiveMediaStateSubscription?.unsubscribe();
  }
}
