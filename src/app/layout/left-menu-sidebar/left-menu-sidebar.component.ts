import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  HostListener,
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  NgbModalConfig,
  NgbModal,
  NgbModalRef,
} from "@ng-bootstrap/ng-bootstrap";
import { HttpErrorResponse } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { Subscription } from "rxjs";
import { getUserFromLocalStorage } from "src/app/shared/services/localstorage-user";
import { UserService } from "src/app/shared/services/user/user.service";
import { DataShareService } from "src/app/shared/services/data-share-services/data-share.service";
import { EventStatusEnum } from "src/app/shared/enums/event-status.enum";
import {
  LocalstorageKeyEnum,
  StepEnum,
  RoleEnum,
  DashboardViewEnum,
  EventService,
  AgoraRtcStreamHandlerService,
  AgoraRtcSidecallHandlerService,
} from "src/app/shared";
import { ProfileDetaiModalComponent } from "src/app/shared/components/profile-detail-modal/profile-detail-modal.component";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-left-menu-sidebar",
  templateUrl: "./left-menu-sidebar.component.html",
  styleUrls: ["./left-menu-sidebar.component.scss"],
})
export class LeftMenuSidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() view_state = DashboardViewEnum.CHAT_ONLY;
  @Input() messenger_indicator = 0;
  @Input() event_status: number;
  @Input() event_id: string;
  @Input() is_available_sidechat: boolean;
  @Input() handlerRole: number;
  @Input() isRaisedHand: boolean;
  @Input() isFullScreenActive: boolean;
  @Input() isUserOnAir: boolean;

  @Output() viewChanged = new EventEmitter<DashboardViewEnum>();
  @Output() leaveEvent = new EventEmitter<string>();

  @ViewChild("leftMenu") leftMenuEl: ElementRef;
  deviceSettingActive: boolean = false;
  private modalRef: NgbModalRef;

  roles = {
    MODERATOR: RoleEnum.MODERATOR,
    ATTENDEE: RoleEnum.ATTENDEE,
  };

  event_statuses = {
    PENDING: EventStatusEnum.PENDING,
    STARTED: EventStatusEnum.STARTED,
    ENDED: EventStatusEnum.ENDED,
  };

  genericError = "service is not available. please try again later.";
  selected_fanspace_role_id = RoleEnum.MODERATOR;
  loading = false;
  video_loading = false;
  is_event_dashboard = false;
  media_only = false;
  chat_only = true;
  isEventStarted = false;
  serverError: any = null;
  isClicked=true;
  fanspaceLogo: string;
  userData: any;
  eventState: any;
  accountData: any;
  events = [];
  fanspaces = [];

  castUserSubscription: Subscription;
  castEventStatusSubscription: Subscription;
  castLocalStreamSubscription: Subscription;

  public show_video_control = false;
  public show_audio_control = false;
  public is_video_on = true;
  public is_audio_on = true;
  public user_Participant_Id: number;
  isEmojiMartOpen: boolean = false;
  selectedEmoji: string;
  raiseHandLoader: boolean = false;
  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private modalConfig: NgbModalConfig,
    private modalService: NgbModal,
    private userService: UserService,
    private toastr: ToastrService,
    private eventService: EventService,
    private dataShareService: DataShareService,
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    public sidecallService: AgoraRtcSidecallHandlerService
  ) {
    if (
      router.url.toString().includes("/event/event-attendee-dashboard") ||
      router.url.toString().includes("/event/event-moderator-dashboard")
    ) {
      this.is_event_dashboard = true;
      this.fanspaceLogo = localStorage.getItem(
        LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO
      );
      this.fanspaceLogo = this.fanspaceLogo ? this.fanspaceLogo : "";
    }

    this.castUserSubscription = this.dataShareService.castUser.subscribe(
      (user) => {
        if (user) {
          this.userData = user;
        }
      }
    );
    this.castEventStatusSubscription =
      this.dataShareService.castEventStatus.subscribe((eventStatus) => {
        if (eventStatus && eventStatus != undefined) {
          this.eventState = eventStatus;
        }
      });

    this.selected_fanspace_role_id = localStorage.getItem(
      LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID
    )
      ? parseInt(
          localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID)
        )
      : RoleEnum.MODERATOR;

    this.castLocalStreamSubscription =
      this.agoraRTCStreamHandler.castLocalStream.subscribe((localStream) => {
        const videoTrack = localStream?.videoTrack;
        const audioTrack = localStream?.audioTrack;
        if (videoTrack) {
          this.show_video_control = true;
          this.show_audio_control = true;
          // this.is_video_on = !!this.agoraRTCStreamHandler.isVideoEnabled;
          // this.is_audio_on = !!this.agoraRTCStreamHandler.isAudioEnabled;
        }
      });

    this.agoraRTCStreamHandler.castFullScreenHandler.subscribe((data) => {
        if(this.isClicked){
        this.view_state=DashboardViewEnum.CHAT_ONLY;
        }
        else{
          this.media_only = !data.isFullScreen;
          this.chat_only = true;
          this.setViewChanged();
        }
    });
  }

  ngOnInit(): void {
    //this.setViewChanged();
    this.userData = getUserFromLocalStorage();
  }

  ngOnDestroy() {
    this.castUserSubscription.unsubscribe();
    this.castEventStatusSubscription.unsubscribe();
    this.castLocalStreamSubscription.unsubscribe();
  }

  // changes.prop contains the old and the new value...
  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.view_state && changes.view_state.currentValue) {
      this.media_only =
        this.view_state == DashboardViewEnum.ALL ||
        this.view_state == DashboardViewEnum.MEDIA_ONLY
          ? true
          : false;
      this.chat_only =
        this.view_state == DashboardViewEnum.ALL ||
        this.view_state == DashboardViewEnum.CHAT_ONLY
          ? true
          : false;
    }
    this.isEventStarted =
      this.event_status == EventStatusEnum.STARTED ? true : false;

    // check if full screen mode is active then hide left media and side chat
    if (this.agoraRTCStreamHandler.isFullScreenActive) {
      this.media_only = false;
      this.chat_only = true;
      this.setViewChanged();
    }
  }

  mediaClicked() {
    this.media_only = !this.media_only;
    this.isClicked=!this.isClicked;
    this.setViewChanged();
    // reset full screen mode if it exist
    this.agoraRTCStreamHandler.isFullScreenActive = false;
  }

  chatClicked() {
    this.chat_only = !this.chat_only;
    this.setViewChanged();
    // reset full screen mode if it exist
    this.agoraRTCStreamHandler.isFullScreenActive = false;
  }

  setViewChanged() {
    this.view_state =
      this.media_only && this.chat_only
        ? DashboardViewEnum.ALL
        : this.media_only && !this.chat_only
        ? DashboardViewEnum.MEDIA_ONLY
        : !this.media_only && this.chat_only
        ? DashboardViewEnum.CHAT_ONLY
        : DashboardViewEnum.NONE;
    this.viewChanged.emit(this.view_state);
  }

  onLoggedout() {
    localStorage.clear();
    this.modalRef.close();
    this.router.navigate(["/login"]);
  }

  editProfile() {
    if (this.is_event_dashboard && this.isEventStarted) {
      const refModal = this.modalService.open(ProfileDetaiModalComponent, {
        backdrop: "static",
        keyboard: false,
        windowClass: "profile_change",
        centered: true,
      });
      refModal.componentInstance.eventId = this.event_id;
      refModal.componentInstance.profilePicture = this.userData.profile_picture;
      refModal.componentInstance.userId = this.userData.user_id;
    } else {
      this.router.navigate(["/profile"]);
    }
  }

  getConnectedFanspaces() {
    this.serverError = null;
    this.loading = true;
    this.userService.getConnectedFanspaces().subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          this.fanspaces = response.data.connected_fanspaces;
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.loading = false;
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");

        if (err && err.status && err.status == 401) {
          localStorage.clear();
          this.router.navigate(["/login"]);
        }
      }
    );
  }

  switchFanspace(model) {
    this.getConnectedFanspaces();
    this.modalRef = this.modalService.open(model, {
      windowClass: "fanspaces_window",
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  setSelectedFanspace(fanspaceId, roleId, fanspacesName, fanspacesLogo) {
    if (fanspaceId && roleId) {
      localStorage.setItem(
        LocalstorageKeyEnum.SELECTED_FANSPACE_ID,
        `${fanspaceId}`
      );
      localStorage.setItem(
        LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID,
        `${roleId}`
      );
      localStorage.setItem(
        LocalstorageKeyEnum.SELECTED_FANSPACE_NAME,
        `${fanspacesName}`
      );
      localStorage.setItem(
        LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO,
        `${fanspacesLogo}`
      );
      localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);

      this.selected_fanspace_role_id = parseInt(
        localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID)
      );

      this.getAllEvents(fanspaceId);
      this.dataShareService.updatedFanspace({
        fanspaceName: localStorage.getItem("selected_fanspace_name"),
        logo: localStorage.getItem("selected_fanspace_logo"),
      });
      this.modalRef.close();

      let hasAccess =
        this.selected_fanspace_role_id == RoleEnum.MODERATOR ? true : false;
      this.dataShareService.updatedAccess(hasAccess);

      if (this.selected_fanspace_role_id == RoleEnum.ATTENDEE) {
        this.router.navigate(["/dashboard"]);
      } else {
        this.router.navigate(["/moderator-dashboard"]);
      }
    }
  }

  //Get all event data
  getAllEvents(fanspaceId) {
    this.eventService.getAllEvents(fanspaceId).subscribe(
      (response: any) => {
        if (response && response.is_success) {
          this.events = response.data.events;
          this.dataShareService.gotAllEvents(response.data);
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }

  createNewFanspace() {
    this.modalRef.close();
    localStorage.setItem(
      LocalstorageKeyEnum.STEP,
      StepEnum.CREATE_NEW_FANSPACE
    );
    this.router.navigate(["/what-we-call-your-fanspace"]);
  }

  checkoutAccountDetails(model) {
    this.getUserData();
    this.modalService.open(model, {
      windowClass: "account_window",
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  getUserData() {
    this.userService.getUserDetails().subscribe(
      (response: any) => {
        if (response && response.is_success) {
          this.accountData = response.data.user;
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }

  attendeeLeaveEvent() {
    if (
      this.eventState &&
      this.eventState.event_id &&
      this.eventState.event_code &&
      this.eventState.event_status &&
      this.eventState.event_status == EventStatusEnum.STARTED
    ) {
      this.leaveEvent.emit(this.eventState.event_id);
      this.modalRef.close();
    }
  }

  openModel(content, class_name = "") {
    this.modalRef = this.modalService.open(content, {
      windowClass: class_name,
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  redirectOnLegalPage(page) {
		if (page === 'legal') {
      window.open(`${environment.billionsLiveUrl}legal`, "_blank");
		}
		else {
			window.open(`${environment.billionsLiveUrl}policy`, "_blank");
		}
	}

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-01
   * @Description: update available for sidechat status
   **/
  changeAvailableSidechatStatus(event) {
    this.leftMenuEl.nativeElement.click();

    let value = {
      event_id: this.event_id,
      user_id: this.userData.user_id,
      is_available_for_sidechat: event.target.checked,
    };

    this.eventService.availableForSidechat(value).subscribe(
      (response: any) => {
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
        } else {
          this.toastr.error(response.message, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }

  toggleDeviceSettingPopup(event) {
    event.stopPropagation();
    // if (this.agoraRTCStreamHandler.isVideoEnabled) {
    //   this.deviceSettingActive = false;
    //   return;
    // }
    this.deviceSettingActive = !this.deviceSettingActive;
    // if (!this.deviceSettingActive && this.handlerRole === RoleEnum.MODERATOR) {
    //   this.agoraRTCStreamHandler.playLocalStream(
    //     `${this.userData.user_id}-local_stream`
    //   );
    // }

    // if (!this.deviceSettingActive && this.handlerRole === RoleEnum.ATTENDEE) {
    //   this.agoraRTCStreamHandler.closeCameraMic();
    // }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  changeRaisedHandStatus() {
    this.raiseHandLoader = true;
    const value = !this.isRaisedHand;
    let allParticipants = this.agoraRTCStreamHandler.eventParticipants;
    let currentParticipant;
    if (!this.user_Participant_Id) {
      currentParticipant = allParticipants.find(
        (data) => this.userData.user_id === data.user.userId
      );
      this.user_Participant_Id = currentParticipant?.eventParticipantId;
    }

    const data = {
      participant_id: this.user_Participant_Id,
      raised_hand: value,
    };
    //TODO Update Raised Hand setting on Backend
    this.eventService.toggleRaiseHand(data).subscribe(
      (response: any) => {
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.isRaisedHand = !this.isRaisedHand;
        } else {
          this.toastr.error(response.message, "Error");
        }
        this.raiseHandLoader = false;
      },
      (err: HttpErrorResponse) => {
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");
        this.raiseHandLoader = false;
      }
    );
  }

  fullScreenHandler() {
    this.agoraRTCStreamHandler.handleFullScreen();
  }

  @HostListener("document:click", ["$event"])
  handleOutsideClick(event) {
    let target = event.target.closest("#mediaInputSetting");
    if (!target) {
      this.deviceSettingActive = false;
    }
  }

  toggleEmojiMart() {
    this.isEmojiMartOpen = !this.isEmojiMartOpen;
  }

  emojiSelected(event) {
    this.selectedEmoji = (event.emoji as any).native;
    // const input = this.tagline_input.nativeElement;
    // input.focus();
    // if (document.execCommand) {
    //   let event = new Event("input");
    //   document.execCommand("insertText", false, emoji);
    //   return;
    // }
    // const [start, end] = [input.selectionStart, input.selectionEnd];
    // input.setRangeText(emoji, start, end, "end");
  }
}
