import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "app-html5-player",
  templateUrl: "./html5-player.component.html",
  styleUrls: ["./html5-player.component.scss"],
})
export class Html5PlayerComponent implements OnInit, AfterViewInit {
  @ViewChild("videoPlayer") videoPlayer: ElementRef;
  @Input() videoID: string;
  @Input() htmlMedia: boolean;
  @Input() viewState: number;
  @Input() renderPos: number;
  @Input() type: string;
  @Input() handlerRole: number;
  @Output() htmlPlayerReady = new EventEmitter<object>();
  @Output() htmlPlayerStateChange = new EventEmitter<object>();
  @Output() htmlPlayerSeeked = new EventEmitter<object>();


  constructor() {
    var jQueryScript = document.createElement("script");
    var jQueryScripts = document.createElement("script");
    var jQueryScriptLink = document.createElement("link");
    jQueryScriptLink.setAttribute(
      "href",
      "https://cdnjs.cloudflare.com/ajax/libs/video.js/5.10.2/alt/video-js-cdn.css"
    );
    jQueryScript.setAttribute(
      "src",
      "https://cdnjs.cloudflare.com/ajax/libs/video.js/5.10.2/video.js"
    );
    jQueryScripts.setAttribute(
      "src",
      "https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-hls/3.0.2/videojs-contrib-hls.js"
    );
    document.head.appendChild(jQueryScript);
    document.head.appendChild(jQueryScripts);
    document.head.appendChild(jQueryScriptLink);
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    try {
      this.loadingAllEvents();
    } catch (err) {}
  }

  loadingAllEvents() {
    const videoElement = this.videoPlayer.nativeElement;
    if(this.handlerRole!==3){
      videoElement.controls=false;
    }
    // loaded meta data, hits after video playing
    videoElement.addEventListener("loadedmetadata", (event) => {
      console.log("Hello META DATA", event);
    });

    // loaded data, hits after video playing
    videoElement.addEventListener("loadeddata", (event) => {
      console.log("Hello LOADED DATA", event);
      this.htmlPlayerReady.emit(event);
    });

    // Hits when video play
    videoElement.addEventListener("play", (event) => {
      console.log("madhur-play", event);
      this.htmlPlayerStateChange.emit({ data: 1 }); // sending play state
    });

    // Hits when video pause
    videoElement.addEventListener("pause", (event) => {
      console.log("madhur-pause");
      this.htmlPlayerStateChange.emit({ data: 2 }); // sending pause state
    });

    // Hits when video ended
    videoElement.addEventListener("ended", (event) => {
      console.log("Video Ended");
      this.htmlPlayerStateChange.emit({ data: 0 }); // sending end state
    });

    // Current time
    // videoElement.addEventListener("timeupdate", (event) => {
    //   // console.log("CurrentTime Updated");
    // });

    // Hits when video start seeking
    // videoElement.addEventListener("seeking", (event) => {
    //  console.log("Video is seeking a new position.");
    // });

    // // // Hits when video seeked
    videoElement.addEventListener("seeked", (event) => {
      console.log("madhur-seeked");
     this.htmlPlayerSeeked.emit({ data: 6 }); // sending end state\
    });
  }
}
