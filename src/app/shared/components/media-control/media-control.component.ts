import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AgoraMediaTypeEnum } from "../../interfaces/agora-media-stream.interface";
import { AgoraRtcSidecallHandlerService } from "../../services/agora/agora-rtc-sidecall-handler.service";
import { AgoraRtcStreamHandlerService } from "../../services/agora/agora-rtc-stream-handler.service";

@Component({
  selector: "app-media-control",
  templateUrl: "./media-control.component.html",
  styleUrls: ["./media-control.component.scss"],
})
export class MediaControlComponent implements OnInit {
  @Input() mediaType: AgoraMediaTypeEnum;
  @Input() mediaIcon: string;
  @Input() isMuted: boolean;
  @Output() onMediaControlClick = new EventEmitter<string>();
  constructor(
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    public sidecallService: AgoraRtcSidecallHandlerService
  ) {}

  ngOnInit(): void {}

  handleMediaClick() {
    if (this?.onMediaControlClick.observers.length) {
      this?.onMediaControlClick.emit();
      return;
    }
    if (this.mediaType === AgoraMediaTypeEnum.VIDEO) {
      this.agoraRTCStreamHandler.toggleCamera();
    } else if (this.mediaType === AgoraMediaTypeEnum.AUDIO) {
      this.agoraRTCStreamHandler.toggleMic();
    }
  }
}
