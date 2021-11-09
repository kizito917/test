import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { AgoraRtcStreamHandlerService, getUserFromLocalStorage, UserInterface } from "src/app/shared";

@Component({
  selector: "app-agora-video-player",
  templateUrl: "./agora-video-player.component.html",
  styleUrls: ["./agora-video-player.component.scss"],
})
export class AgoraVideoPlayerComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @Input() stream: any;
  @Input() streamID: any;
  @Input() videoTrack: any;
  @Input() audioTrack: any;

  @ViewChild("container") streamRef: ElementRef;

  user: UserInterface;

  constructor(private agoraStreamHandler: AgoraRtcStreamHandlerService) {}

  ngOnInit(): void {
    console.log("audio track ", this.audioTrack);
    console.log("video track ", this.videoTrack);

    this.user = getUserFromLocalStorage();
  }

  ngAfterViewInit(): void {
    if (this.videoTrack?.isPlaying) this.videoTrack?.stop();
    this.streamRef.nativeElement.innerHTML = "";
    this.videoTrack?.play(this.streamRef.nativeElement);
    // if (this.stream?.isModerator) return;
    // check if it's local stream then do not play audio
    if (this.user.user_id !== this.streamID) this.audioTrack?.play();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.videoTrack && changes.videoTrack.currentValue) {
      if (this.streamRef) {
        this.streamRef.nativeElement.innerHTML = "";
        this.videoTrack?.play(this.streamRef.nativeElement);
      }
    }
    if (changes.audioTrack && changes.audioTrack.currentValue) {
      if (this.user?.user_id && this.user?.user_id !== this.streamID)
        this.audioTrack?.play();
    }
  }

  ngOnDestroy(): void {
    if (this.videoTrack?.isPlaying) this.videoTrack?.stop();
    if (this.stream?.audioTrack?.isPlaying) this.audioTrack?.stop();
  }

  onattendeeSelected(streamId){
    this.agoraStreamHandler.onVideoCallUserSelected(streamId);
  }

}
