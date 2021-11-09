import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  ViewEncapsulation,
  SimpleChanges,
} from "@angular/core";
import {
  AgoraMediaStream,
  AgoraRtcStreamHandlerService,
  getUserFromLocalStorage,
  STREAMSLAYOUT,
  UserInterface,
} from "src/app/shared";
import { Subscription } from "rxjs";
@Component({
  selector: "app-agora-media-player",
  templateUrl: "./agora-media-player.component.html",
  styleUrls: ["./agora-media-player.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AgoraMediaPlayerComponent implements OnInit, OnDestroy, OnChanges {
  public user: UserInterface;
  castUpdateRemoteUserSubscription: Subscription;
  castLiveMediaStateSubscription: Subscription;
  @Input() mediaType: string;
  @Input() eventId: string;
  @Input() viewState: number;
  @Input() renderPos: string;
  @Input() moderatorWithCommentry:boolean;
  @Input() attendeeWithCommentry:boolean;
  public selectedOverlay: string;
  public selectedBackground: string;
  public moderatorUId: string;
  public clearTimeoutRef: any;
  //  moderatorStreamUid: number = -1;
  remoteStreams: AgoraMediaStream[] = [];
  channelUsers = [];
  public primaryLayoutStreams: AgoraMediaStream[] = [];
  public secondaryLayoutStreams: AgoraMediaStream[] = [];
  public commentryLayoutStreams: AgoraMediaStream[] = [];
  constructor(public agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {}

  ngOnInit(): void {
    this.user = getUserFromLocalStorage();
    this.castUpdateRemoteUserSubscription =
      this.agoraRTCStreamHandler.castUpdateRemoteUser.subscribe((data) => {
        this.remoteStreams = [];
        this.channelUsers = this.agoraRTCStreamHandler.mediaDataForView;
        this.handleMediaUpdate();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.mediaType &&
      !changes.mediaType.firstChange &&
      changes.mediaType.currentValue !== changes.mediaType.previousValue ||
      changes.attendeeWithCommentry || 
      changes.moderatorWithCommentry
    ) {
      this.handleMediaUpdate();
    }
  }

  handleMediaUpdate() {
    this.primaryLayoutStreams = [];
    this.commentryLayoutStreams = [];
    this.secondaryLayoutStreams=[];
    this.attendeeWithCommentry =  this.agoraRTCStreamHandler.activeEventState.data?.attendeeWithCommentry;
    this.moderatorWithCommentry = this.agoraRTCStreamHandler.activeEventState.data?.moderatorWithCommentry;
    // getting all remote streams in remoteStreams variable
    this.upgradeStreamParams();

    if(this.moderatorWithCommentry || this.attendeeWithCommentry){
      this.remoteStreams = this.remoteStreams.filter( (stream) => {
        if(stream.userId[stream.userId.length - 1] === 's'){
          return true;
        }
        if(this.moderatorWithCommentry && stream.userId === this.moderatorUId){
          this.commentryLayoutStreams.push(stream);
          return false;
        }
        if(this.attendeeWithCommentry && stream.userId.indexOf(this.moderatorUId) === -1){
          this.commentryLayoutStreams.push(stream);
          return false;
        }
        return true;
      })
      if(this.remoteStreams)
        this.prepareStreamLayouts()
    }

    else {
      this.prepareStreamLayouts();
    }
  }

  prepareStreamLayouts() {
    // add some extra fields to streams
    // this.upgradeStreamParams();
    const totalStreamLength = this.remoteStreams.length;
    let primaryStreamsCount = totalStreamLength;
    switch (true) {
      case totalStreamLength <= 5:
        primaryStreamsCount = 4;
        break;
      case totalStreamLength == 6:
        primaryStreamsCount = 5;
        break;
      case totalStreamLength == 7:
        primaryStreamsCount = 6;
        break;
      case totalStreamLength >= 8:
        primaryStreamsCount = 6;
        break;
    }

    // set moderator stream pos in remote streams if it exist
    this.setModeratorStreamPos();
    this.primaryLayoutStreams = this.remoteStreams.splice(
      0,
      primaryStreamsCount
    );
    if (this.remoteStreams.length)
      this.secondaryLayoutStreams = [...this.remoteStreams];

    // set the remote stream type as low resolution for secondary stream
    this.agoraRTCStreamHandler.setRemoteStreamType(
      this.secondaryLayoutStreams,
      "low"
    );
  }

  setModeratorStreamPos() {
    const remoteStreamLength = this.remoteStreams.length;
    // check if moderator stream exist
    const moderatorStreamIndex = this.remoteStreams.findIndex(
      (stream) => stream.userId === this.moderatorUId
    );

    if (moderatorStreamIndex !== -1) {
      switch (true) {
        case remoteStreamLength <= 4 || remoteStreamLength == 6: {
          // put moderator stream at first pos
          if (moderatorStreamIndex !== 0) {
            // replace 0 index stream with moderator stream index
            this.shuffleStreams(0, moderatorStreamIndex);
          }
          break;
        }
        case remoteStreamLength == 5 || remoteStreamLength == 7: {
          // put moderator stream at end pos
          if (moderatorStreamIndex !== remoteStreamLength - 1) {
            // replace last index stream with moderator stream index
            this.shuffleStreams(remoteStreamLength - 1, moderatorStreamIndex);
          }
          break;
        }
        case remoteStreamLength == 8: {
          // put moderator stream at 2nd last pos
          if (moderatorStreamIndex !== remoteStreamLength - 2) {
            // replace 2nd last index stream with moderator stream index
            this.shuffleStreams(remoteStreamLength - 2, moderatorStreamIndex);
          }
          break;
        }
      }
    }
  }

  shuffleStreams(attendeeIndex, ModeratorIndex) {
    const attendeeStream = this.remoteStreams[attendeeIndex];
    this.remoteStreams[attendeeIndex] = this.remoteStreams[ModeratorIndex];
    this.remoteStreams[ModeratorIndex] = attendeeStream;
  }

  upgradeStreamParams() {
    this.remoteStreams = [];
    // check for local stream
    this.channelUsers.map((user, index) => {
      const stream = user.videoStream || user.audioStream || {};
      stream.userId = user.userId;
      stream.profilePicture = user.profile_picture;
      stream.isVideoMuted = !user.videoStream;
      // check if user is moderator
      if (user.isModerator) {
        this.moderatorUId = user.userId;
      }
      this.remoteStreams.push(stream);
    });
  }

  // this is handler for getting video layout info based on streams count
  getContainerStyle = () => {
    let gridContainerStyle: any = {
      gridTemplateRows: "repeat(12, auto)",
      gridTemplateColumns: "repeat(24, auto)",
    };
    if (
      STREAMSLAYOUT.streamsContainerLayout[this.primaryLayoutStreams.length]
    ) {
      gridContainerStyle = {
        gridTemplateColumns: `repeat(auto-fit, minmax(${
          STREAMSLAYOUT["streamsContainerLayout"][
            this.primaryLayoutStreams.length
          ]
        }, 1fr)`,
      };
    }
    const style = {
      display: "grid",
      height: "100%",
      ...gridContainerStyle,
    };

    return style;
  };

  getPrimaryMediaStyle = (index: number): any => {
    return (
      STREAMSLAYOUT.streamLayout[this.primaryLayoutStreams.length] && {
        gridArea:
          STREAMSLAYOUT.streamLayout[this.primaryLayoutStreams.length][index],
      }
    );
  };

  identify(index, stream) {
    return (stream && stream.userId) || index;
  }

  ngOnDestroy(): void {
    this.castUpdateRemoteUserSubscription?.unsubscribe();
  }
}
