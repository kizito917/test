import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-sidecall-media-controls",
  templateUrl: "./sidecall-media-controls.component.html",
  styleUrls: ["./sidecall-media-controls.component.scss"],
})
export class SidecallMediaControlsComponent implements OnInit {
  @Input() is_allow_sidechat_audio;
  @Input() sideChatCall;
  @Input() isSelectedProfileOnAir;
  @Input() isLoggedInUserOnAir;
  @Input() sideCallRoom;
  @Input() isRoomLocked;
  @Input() isAvailableForSidechatProfile;
  @Input() callLoading;
  @Input() userAvailabilityMsg;
  @Input() isBlock;
  @Input() participant;
  @Input() noOfUserJoined;
  @Input() modalCalling;
  @Input() is_allow_sidechat_video;
  @Input() messengerTab: boolean = false;

  @Output() callmodal = new EventEmitter<Object>();
  @Output() showPopup = new EventEmitter<Object>();

  constructor() {}

  ngOnInit(): void {}

  callModal(receiver, callType) {
    this.callmodal.emit({ receiver, callType });
  }

  showJoinCallPopup(content, type) {
    this.showPopup.emit({ content, type });
  }
}
