import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  TemplateRef,
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  NgbModalRef,
  NgbModalConfig,
  NgbModal,
} from "@ng-bootstrap/ng-bootstrap";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";

import {
  DashboardViewEnum,
  VisualTypeEnum,
  EventSocketService,
  UserInterface,
  fieldIsRequired,
  getUserFromLocalStorage,
  setUserIntoLocalStorage,
  LeaveComponentInterface,
  MessengerInterface,
  EventService,
  AuthService,
  LocalstorageKeyEnum,
  RoleEnum,
  UserService,
  AgoraRtcStreamHandlerService,
  BroadcastStreamingContent,
  AgoraRtcSidecallHandlerService,
  extractYoutubeCode,
  commaValidator,
  onlyTextAndSpace,
  emailValidator,
  LocalStorageService,
} from "src/app/shared";
import { EventStatusEnum } from "src/app/shared/enums/event-status.enum";
import { DataShareService } from "src/app/shared/services/data-share-services/data-share.service";
import { ControlContainerSubmissionService } from "src/app/shared/components/control-container/control-container-submission.service";
import { ProfileImgModalComponent } from "src/app/shared/components/profile-img-modal/profile-img-modal.component";
import { debounceTime, filter, map } from "rxjs/operators";

@Component({
  selector: "app-event-moderator-dashboard",
  templateUrl: "./event-moderator-dashboard.component.html",
  styleUrls: ["./event-moderator-dashboard.component.scss"],
})
export class EventModeratorDashboardComponent
  implements OnInit, OnDestroy, LeaveComponentInterface
{
  boxes = {
    join_event_step1_box: 1,
    join_event_step2_box: 2,
  };
  views = {
    NONE: DashboardViewEnum.NONE,
    ALL: DashboardViewEnum.ALL,
    MEDIA_ONLY: DashboardViewEnum.MEDIA_ONLY,
    CHAT_ONLY: DashboardViewEnum.CHAT_ONLY,
  };

  visual_types = {
    BACKGROUND: VisualTypeEnum.BACKGROUND,
    OVERLAY: VisualTypeEnum.OVERLAY,
    PROFILE_CARD_BANNER: VisualTypeEnum.PROFILE_CARD_BANNER,
    TRANSITION: VisualTypeEnum.TRANSITION,
  };

  event_statuses = {
    PENDING: EventStatusEnum.PENDING,
    STARTED: EventStatusEnum.STARTED,
    ENDED: EventStatusEnum.ENDED,
  };
  view_state = DashboardViewEnum.CHAT_ONLY;

  tabs = {
    block_details: 1,
    block_preferences: 2,
    block_visuals: 3,
    block_ad_carousel: 4,
    block_invite_link: 5,
    block_live_media: 6,
    block_live_qa: 7,
  };

  event_visuals = {
    background_visuals: [],
    overlay_visuals: [],
    profile_card_banner_visuals: [],
    transition_visuals: [],
  };

  carousel_setting = {
    is_ad_carousel_active: false,
    ad_carousel_interval: 20,
  };

  selectedMedia = {
    visual_type: 0,
    media: "",
  };

  duration_data = [
    { value: 30, name: "30 Mins" },
    { value: 60, name: "60 Mins" },
    { value: 90, name: "90 Mins" },
    { value: 120, name: "120 Mins" },
  ];

  interval_data = [
    { value: 20, name: "20 Sec" },
    { value: 30, name: "30 Sec" },
    { value: 60, name: "60 Sec" },
    { value: 90, name: "90 Sec" },
    { value: 120, name: "120 Sec" },
  ];

  /*ngb_tabs = {
        live_chat: 1,
        messenger: 2,
        calls: 3,
        profile: 4
    };*/

  media = "/assets/image/default-stream@2x.png";
  onAir = "/assets/image/default-stream@2x.png";
  genericError = "service is not available. please try again later.";
  activeBox = this.boxes.join_event_step1_box;

  participants = [];
  all_participants = [];
  visual_files = [];
  carousel_files = [];
  advertise_carousel_banners = [];
  bookmark_user = [];

  navigateToProfile = 1;
  activeTab = 0;
  selectedVisualType = 0;
  messenger_indicator = 0;
  error_message = "";
  selectedBackground = "";
  selectedOverlay = "";
  selectedProfileCardBanner = "";
  selectedAdvertiseCarouselBanner = "";
  advertisecarouselBannerRedirectUrl = "";
  profileError = "";
  carouselBannerId = 0;

  isModerator = false;
  isBookmark = false;
  isSidechat = false;
  isAvailableForSidechat = false;
  isLiveMediaTabactive = true;
  is_fake: false;
  loading = false;
  //advertiseCarouselLoader = false;
  //bgLoader = false;
  //overlayImageLoader = false;
  //profileCardLoader = false;
  //setTransitionLoader = false;
  setScrollButton = false;
  //carouselUrlEditLoader = false;
  serverError: any = null;
  eventGuests = [];
  guestCount: number;
  add_guest_error_message = "";
  duplicate_guest_error_message = "";
  indexStart = false;
  deleteGuestId;

  selectedAttendeeProfileId = '';
  visualType;
  event;
  event_code;
  invite_link;
  fanspace_name;
  deleteImageId;
  selected_image_type;
  blockedList;

  profilePicture: string;
  minDate = new Date();
  cardTextLimit = [15, 35];
  filter_fake_array = [];
  updateTaglineTooltip: boolean = false;
  otherParticipantTooltip: boolean = false;
  attendeeActionLoader: boolean = false;

  guestFG: FormGroup;
  eventDetailsFG: FormGroup;
  startEventFG: FormGroup;
  user: UserInterface;

  private modalRef: NgbModalRef;
  private profileModalRef: NgbModalRef;
  castUserSubscription: Subscription;

  fake_array = Array.from(Array(72), (x, index) => index + 1);

  @ViewChild("modelEndEvent") modelEndEvent: any;
  @ViewChild("modelStartEvent", { static: true })
  modelStartEvent: TemplateRef<any>;

  public moderatorOnCommentry: boolean = false;
  public attendeeOnCommentry: boolean = false;
  public onScreenSceneActiveState: boolean = false;
  public onAudioSceneActiveState: boolean = false;

  public content_type_middle = ""; // used for what type of stream is in middle (agora, youtube)

  public liveMediaUrls = [];
  public liveMedias = [];
  public liveMediaUrl;
  public activeLiveMediaTab = "addLink";
  public isScreenShareMediaAdded = false;

  public isSidePanelRoom: boolean = false;
  public audioPlayFailed: boolean = false;
  public calle_id: string = null;
  public sideCallRoom: any = null;
  public is_call_in_progress: boolean = false;
  public calleInfo: any = null;

  castScreenShareSubscription: Subscription;
  castTriggerLiveStreamActionSubscription: Subscription;
  public handlerRole = RoleEnum.MODERATOR;

  public isModeratorAudioOnly: boolean = false;
  // results$: Observable;
  mediaUpdate = new BehaviorSubject<any>("");
  @ViewChild("filterShow") filterShowEl: ElementRef;

  roomStartSubscription: Subscription;
  castHandleAutoPlayFailed: Subscription;
  switchStreamInProcess: boolean = true;
  initialRender: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataShareService: DataShareService,
    private eventSocketService: EventSocketService,
    private modalConfig: NgbModalConfig,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private FB: FormBuilder,
    private eventService: EventService,
    public datepipe: DatePipe,
    private controlContainerSubmissionService: ControlContainerSubmissionService,
    private userService: UserService,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    public sidecallService: AgoraRtcSidecallHandlerService
  ) {
    let selected_fanspace_role_id = localStorage.getItem(
      LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID
    );

    if (
      selected_fanspace_role_id &&
      parseInt(selected_fanspace_role_id) == RoleEnum.MODERATOR
    ) {
      this.route.params.subscribe((params) => {
        if (params && params.event_code) {
          this.event_code = params.event_code;
          this.getEventDetails();
        } else {
          this.router.navigate(["not-found"]);
        }
      });
    } else {
      this.router.navigate(["/"]);
    }

    this.fanspace_name = localStorage.getItem(
      LocalstorageKeyEnum.SELECTED_FANSPACE_NAME
    );

    this.eventDetailsFG = this.FB.group({
      eventName: ["", [fieldIsRequired("Name")]],
      scheduleStartTime: [""],
      duration: [""],
      description: [""],
    });

    //add guest user form
    this.guestFG = this.FB.group({
      guest_users: this.FB.array([this.newGuest()]),
      email_address: ["", [commaValidator()]],
      reference_name: ["", [onlyTextAndSpace("Name")]],
    });

    this.user = getUserFromLocalStorage();
    this.profilePicture = this.user.profile_picture;

    this.startEventFG = this.FB.group({
      display_name: [
        `${
          this.user.display_name ? this.user.display_name : this.user.full_name
        }`,
        [fieldIsRequired("Display Name")],
      ],
      tag_line: [`${this.user.tag_line}`],
      is_available_for_sidechat: [true],
    });
    this.castHandleAutoPlayFailed =
      this.agoraRTCStreamHandler.castHandleAutoPlayFailed.subscribe((data) => {
        if (data) {
          this.audioPlayFailed = true;
        }
      });
    //get subscribe trigger on profile img update
    this.castUserSubscription = this.dataShareService.castUser.subscribe(
      (user) => {
        if (user) {
          this.profilePicture = user.profile_picture;
        }
      }
    );
  }

  ngOnInit() {
    this.mediaUpdate
      .pipe(
        debounceTime(1000),
        // if character length greater then 2
        filter((mediaInfo = {}) => mediaInfo?.mediaTitle?.length > 5)
      )
      .subscribe((mediaInfo) => {
        this.updateMediaTitle(mediaInfo);
      });

    this.roomStartSubscription =
      this.sidecallService.castSidecallRoomStart.subscribe((data) => {
        if (data?.action === "room_start" || data?.action === "room_extand") {
          this.isSidePanelRoom = true;
          this.sideCallRoom = this.sidecallService.sidecallRoom;
          this.calleInfo = this.sidecallService.currentReciever;
        } else {
          this.isSidePanelRoom = false;
          this.sideCallRoom = null;
          this.calleInfo = null;
        }
      });

    // set handler role to agora service
    this.agoraRTCStreamHandler.handlerRole = RoleEnum.MODERATOR;
    this.agoraRTCStreamHandler.castCallUserSelected.subscribe((data) => {
      if (data) {
        this.attendeeSelectedHandler(data);
      }
    });
  }

  async ngOnDestroy() {
    // end agora session first
    await this.agoraRTCStreamHandler.leaveRoomChannel();
    this.castScreenShareSubscription &&
      this.castScreenShareSubscription.unsubscribe();
    this.castTriggerLiveStreamActionSubscription &&
      this.castTriggerLiveStreamActionSubscription.unsubscribe();
    this.roomStartSubscription && this.roomStartSubscription.unsubscribe();
  }

  canLeaveComponent(): boolean {
    if (
      this.event &&
      this.event.eventStatus == this.event_statuses.STARTED &&
      this.authService.isLoggedIn()
    ) {
      this.openModel(this.modelEndEvent, "eventend_modal_window");
      return false;
    }

    return true;
  }

  viewChangedHandler(view_state) {
    this.view_state = view_state;
  }

  mediaChangedHandler(data) {
    if (data.visual_type == 0) {
      this.onAir = data.media;
    } else if (data.visual_type == this.visual_types.BACKGROUND) {
      this.selectedBackground = data.media;
      //this.bgLoader = false;
    } else if (data.visual_type == this.visual_types.OVERLAY) {
      this.selectedOverlay = data.media;
      //this.overlayImageLoader = false;
    }

    this.broadcastLiveEventState({
      selectedOverlay: this.selectedOverlay,
      selectedBackground: this.selectedBackground,
    });
  }

  attendeeSelectedHandler(participant_user_id) {
    if (participant_user_id != this.selectedAttendeeProfileId) {

      this.selectedAttendeeProfileId = participant_user_id;
      this.navigateToProfile = this.navigateToProfile + 1;

      if (this.view_state == this.views.NONE) {
        this.view_state = this.views.CHAT_ONLY;
      } else if (this.view_state == this.views.MEDIA_ONLY) {
        this.view_state = this.views.ALL;
      }
    }
  }

  messengerIndicatorHandler(count) {
    this.messenger_indicator = count;
  }

  moveNextPreviousProfileHandler(x) {
    //x = 1 - move to Previous Profile
    //x = 2 - move to Next Profile

    //current selected participent index
    let index = this.participants.findIndex(
      (x) => x.user.userId === this.selectedAttendeeProfileId
    );

    if (x == 1) {
      if (index == 0) {
        index = this.participants.length - 1;
      } else {
        --index;
      }
    } else if (x == 2) {
      if (index >= this.participants.length - 1) {
        index = 0;
      } else {
        ++index;
      }
    }

    const participant = this.participants[index];

    this.selectedAttendeeProfileId = participant.user.userId;
  }

  // Tabination UI actions start
  activateTab(tab_state) {
    if (
      tab_state === this.tabs.block_live_qa &&
      this.activeTab !== this.tabs.block_live_qa
    ) {
      this.broadcastLiveEventState({ liveQnAOpenState: true });
    }
    if (
      tab_state !== this.tabs.block_live_qa &&
      this.activeTab === this.tabs.block_live_qa
    ) {
      this.broadcastLiveEventState({ liveQnAOpenState: false });
    }
    this.activeTab = tab_state;
  }

  toggleTab() {
    this.isLiveMediaTabactive = !this.isLiveMediaTabactive;
    //this.activeTab = this.activeTab ==  this.tabs.block_live_media? 0 : this.tabs.block_live_media;
  }

  deactivateTab() {
    if (this.activeTab === this.tabs.block_live_qa) {
      this.broadcastLiveEventState({ liveQnAOpenState: false });
    }
    this.activeTab = 0;
  }
  // Tabination UI actions end

  // Details actions start
  getEventDetails() {
    this.eventService.getEventDetails(this.event_code).subscribe(
      async (response: any) => {
        if (response && response.is_success) {
          this.event = response.data.event;
          this.event_visuals = response.data.event_visuals;
          this.advertise_carousel_banners =
            response.data.advertise_carousel_banners;
          this.participants = response.data.participants;
          this.all_participants = this.participants;
          this.agoraRTCStreamHandler.eventParticipants = this.all_participants;
          this.liveMedias = response.data.live_medias;
          this.blockedList = response.data.blocked_list;
          this.prepareLiveMedias();
          for (let i = 0; i < this.participants.length; i++) {
            this.fake_array.pop();
          }

          //check user id moderator than use it by onput()
          this.isModerator =
            this.event.createdBy === this.user.user_id ? true : false;

          //update is available for sidechat by input()
          let result = this.participants.find(
            (x) => x.user.userId == this.user.user_id
          );
          this.isAvailableForSidechat = result
            ? result.isAvailableForSidechat
            : false;

          // check if the logged in user is busy with side call
          if (result?.sidechatCall) {
            this.sidecallService.leaveSideCallOnPageReload(result.sidechatCall);
            this.sideCallRoom = null;
          }

          if (response.data.event?.eventSetting?.allowGuestOnly) {
            this.getEventGuestsByEventId();
          }

          //filter messanger user fn call
          this.messagerUserFilter();

          this.subscribeToEventChannels();

          // check if event is already started then allow moderator to join the agora session and publish their stream
          //   if (this.event?.eventStatus === this.event_statuses.STARTED || 1) {
          // check for current streaming state and apply
          if (this.event.currentStreamingContent) {
            const parsedJsonData = JSON.parse(
              this.event.currentStreamingContent
            );
            // update live media state
            this.agoraRTCStreamHandler.setActiveEventState({
              event_id: this.event.eventId,
              data: { ...parsedJsonData },
            });
            this.media = parsedJsonData.media;
            if (parsedJsonData.contentType === "agorascreen") {
              parsedJsonData.contentType = "agora";
              parsedJsonData.media = "";
            }
            this.content_type_middle = parsedJsonData.contentType;
            this.selectedBackground = parsedJsonData.selectedBackground;
            this.selectedOverlay = parsedJsonData.selectedOverlay;
            this.attendeeOnCommentry = parsedJsonData.attendeeWithCommentry;
            this.moderatorOnCommentry = parsedJsonData.moderatorWithCommentry;
          }
          this.agoraRTCStreamHandler.activeEventId = this.event.eventId;
          // start agora local session
          await this.startAgoraHandling();
          // }

          let index = this.event_visuals.profile_card_banner_visuals.findIndex(
            (x) => x.isActive == true
          );

          if (index >= 0) {
            this.selectedProfileCardBanner =
              this.event_visuals.profile_card_banner_visuals[index].fileName;
          }
          this.carousel_setting.is_ad_carousel_active =
            response.data.event.eventSetting.isAdCarouselActive;
          this.carousel_setting.ad_carousel_interval =
            response.data.event.eventSetting.adCarouselInterval;
          let i = this.advertise_carousel_banners.findIndex(
            (x) => x.isActive == true
          );

          if (i >= 0) {
            this.selectedAdvertiseCarouselBanner =
              this.advertise_carousel_banners[i].fileName;

            this.advertisecarouselBannerRedirectUrl =
              this.advertise_carousel_banners[i].redirectUrl;
          }

          this.invite_link =
            location.origin +
            "/" +
            "invite" +
            "/" +
            response.data.event.eventCode;

          console.log(this.invite_link);

          this.eventDetailsFG.patchValue(response.data.event);
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
          this.router.navigate(["/"]);
        }
      },
      (err: HttpErrorResponse) => {
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");

        if (err && err.status && err.status == 401) {
          localStorage.clear();
          this.router.navigate(["/login"]);
        } else {
          this.router.navigate(["/"]);
        }
      }
    );
  }

  submitEventDetailsForm(valid, value) {
    this.serverError = null;
    if (valid) {
      this.loading = true;
      let payload = {
        event_id: this.event.eventId,
        event_name: value.eventName,
        schedule_start_time: value.scheduleStartTime
          ? value.scheduleStartTime
          : "",
        duration: value.duration,
        description: value.description,
      };

      this.eventService.addUpdateEventDetails(payload).subscribe(
        (response: any) => {
          this.loading = false;
          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");

            response.data.event.eventSetting = this.event?.eventSetting;
            this.event = response.data.event;
            this.eventDetailsFG.patchValue(response.data.event);
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
        }
      );
    }
  }

  resetDateTime() {
    this.eventDetailsFG.controls.scheduleStartTime.setValue("");
  }

  backToStep1() {
    this.modalRef.close();
    this.activeBox = this.boxes.join_event_step1_box;
    this.preProcessEvent(this.modelStartEvent, "start_event_window");
  }

  // Details actions start
  // Preferences actions start
  allowParticipantAudioInCrowd(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      allow_participant_audio: value,
    };
    this.eventService.allowDisallowParticipantAudio(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
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
      }
    );
  }

  allowParticipantVideoInCrowd(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      allow_participant_video: value,
    };

    this.eventService.allowDisallowParticipantVideo(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
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
      }
    );
  }

  allowParticipantSideChat(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      allow_participant_sidechat: value,
    };

    this.eventService.allowDisallowParticipantSidechat(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.event.eventSetting.allowParticipantSidechat = value;
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
      }
    );
  }

  allowParticipantVideoInSiteChat(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      allow_participant_sidechat_video: value,
    };

    this.eventService.allowDisallowParticipantSidechatVideo(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.event.eventSetting.allowParticipantSidechatVideo = value;
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
      }
    );
  }

  hideLiveChat(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      allow_live_chat: !value,
    };

    this.eventService.allowDisallowLiveChat(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.event.eventSetting.allowLiveChat = !value;
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
      }
    );
  }

  // Preferences actions end
  // Visuals actions start
  openAddVisualModel(content, visual_type) {
    this.visual_files = [];
    this.visualType = visual_type;
    this.openModel(content, "images_changes_modal");
  }

  closeModel(title = "") {
    this.visual_files = [];
    this.carousel_files = [];
    this.profileError = "";

    if (title && title === "profile_change") {
      this.profileModalRef.close();
    } else {
      this.modalRef.close();
    }
  }

  onVisualsSelect(event, type) {
    if (type == this.visual_types.BACKGROUND) {
      let max_back_image = 5 - this.event_visuals.background_visuals.length;
      if (this.visual_files.length === max_back_image) {
        this.toastr.error("max limit is 5 images", "Error");
        return;
      }
    } else if (type == this.visual_types.OVERLAY) {
      let max_over_image = 20 - this.event_visuals.overlay_visuals.length;
      if (this.visual_files.length === max_over_image) {
        this.toastr.error("max limit is 20 images", "Error");
        return;
      }
    } else if (type == this.visual_types.PROFILE_CARD_BANNER) {
      let max_banner_image =
        6 - this.event_visuals.profile_card_banner_visuals.length;
      if (this.visual_files.length === max_banner_image) {
        this.toastr.error("max limit is 6 images", "Error");
        return;
      }
    } else if (type == this.visual_types.TRANSITION) {
      let max_trans_image = 3 - this.event_visuals.transition_visuals.length;
      if (this.visual_files.length === max_trans_image) {
        this.toastr.error("max limit is 3 images", "Error");
        return;
      }
    }
    if (event.rejectedFiles.length > 0) {
      if (event.rejectedFiles[0].size > 5000000) {
        this.toastr.error("Please select a file less than 5mb", "Error");
      }
    }
    this.visual_files.push(...event.addedFiles);
  }

  onVisualRemove(event) {
    this.visual_files.splice(this.visual_files.indexOf(event), 1);
  }

  saveVisuals(type) {
    this.error_message = "";
    if (this.visual_files.length == 0) {
      this.error_message = "Please select at least image";
      return;
    }
    this.loading = true;
    let formdata = new FormData();

    for (let file of this.visual_files) {
      if (file) {
        formdata.append("visual_images", file);
      }
    }
    formdata.append("event_id", this.event.eventId);
    formdata.append("visual_type", type);

    this.eventService.addEventVisuals(formdata).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          if (response.data && response.data.eventVisuals.length > 0) {
            if (response.data.eventVisuals[0].visualType == 1) {
              for (let created_visual of response.data.eventVisuals) {
                this.event_visuals.background_visuals.push(created_visual);
              }
            } else if (response.data.eventVisuals[0].visualType == 2) {
              for (let created_visual of response.data.eventVisuals) {
                this.event_visuals.overlay_visuals.push(created_visual);
              }
            } else if (response.data.eventVisuals[0].visualType == 3) {
              for (let created_visual of response.data.eventVisuals) {
                this.event_visuals.profile_card_banner_visuals.push(
                  created_visual
                );
              }
            } else if (response.data.eventVisuals[0].visualType == 4) {
              for (let created_visual of response.data.eventVisuals) {
                this.event_visuals.transition_visuals.push(created_visual);
              }
            }
            //this.toastr.success(response.message, "Success");
            this.modalRef.close();
          }
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
      }
    );
  }

  openRemoveVisualModal(content, id, visual_type) {
    this.openModel(content, "delete_conformation_window");
    this.deleteImageId = id;
    this.selected_image_type = visual_type;
  }

  deleteVisaul(id, type) {
    this.loading = true;
    this.eventService.deleteEventVisaul(id).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");

          if (type == this.visual_types.BACKGROUND) {
            this.event_visuals.background_visuals =
              this.event_visuals.background_visuals.filter(
                (item) => item.eventVisualId !== id
              );
          } else if (type == this.visual_types.OVERLAY) {
            this.event_visuals.overlay_visuals =
              this.event_visuals.overlay_visuals.filter(
                (item) => item.eventVisualId !== id
              );
          } else if (type == this.visual_types.PROFILE_CARD_BANNER) {
            this.event_visuals.profile_card_banner_visuals =
              this.event_visuals.profile_card_banner_visuals.filter(
                (item) => item.eventVisualId !== id
              );
          } else if (type == this.visual_types.TRANSITION) {
            this.event_visuals.transition_visuals =
              this.event_visuals.transition_visuals.filter(
                (item) => item.eventVisualId !== id
              );
          }
          this.modalRef.close();
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
      }
    );
  }

  // Visuals actions end
  // Ad Carousel actions start
  openAddAdCarouselModel(content) {
    this.carousel_files = [];
    this.openModel(content, "images_changes_modal");
  }

  onAdCarouselsSelect(event) {
    if (event.rejectedFiles.length > 0) {
      if (event.rejectedFiles[0].size > 5000000) {
        this.toastr.error("Please select a file less than 5mb", "Error");
        //return;
      }
    }
    this.carousel_files.push(...event.addedFiles);
  }

  activateAdCarousel() {
    this.carousel_setting.is_ad_carousel_active =
      !this.carousel_setting.is_ad_carousel_active;
    this.saveAdCarouselSetting();
  }

  saveAdCarouselSetting() {
    if (this.carousel_setting) {
      this.loading = true;
      let payload = {
        event_id: this.event.eventId,
        is_ad_carousel_active: this.carousel_setting.is_ad_carousel_active,
        ad_carousel_interval: this.carousel_setting.ad_carousel_interval,
      };

      this.eventService.updateAdvertiseCarouselSetting(payload).subscribe(
        (response: any) => {
          this.loading = false;
          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
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
        }
      );
    }
  }

  onAdCarouselRemove(event) {
    this.carousel_files.splice(this.carousel_files.indexOf(event), 1);
  }

  saveAdCarousels() {
    this.error_message = "";
    if (this.carousel_files.length == 0) {
      this.error_message = "Please select at least image";
      return;
    }
    this.loading = true;
    let formdata = new FormData();
    for (let file of this.carousel_files) {
      if (file) {
        formdata.append("advertise_carousel_banners", file);
      }
    }
    formdata.append("event_id", this.event.eventId);

    this.eventService.addAdvertiseCarouselBanners(formdata).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          if (response.data && response.data.eventCarousel.length > 0) {
            //this.toastr.success(response.message, "Success");

            for (let created_carousel of response.data.eventCarousel) {
              this.advertise_carousel_banners.push(created_carousel);
            }
            this.modalRef.close();
          }
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
      }
    );
  }

  openRemoveAdCarouselModal(content, id) {
    this.openModel(content, "delete_conformation_window");
    this.deleteImageId = id;
  }

  deleteAdvertiseCarouselBanner(id) {
    this.loading = true;
    this.eventService.deleteAdvertiseCarouselBanner(id).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");

          this.advertise_carousel_banners =
            this.advertise_carousel_banners.filter(
              (item) => item.eventAdCarouselId !== id
            );
          this.modalRef.close();
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
      }
    );
  }

  // Ad Carousel actions end
  // Invite actions start
  copyInviteLink(element) {
    let selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = element;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.toastr.success("Link copied to clipboard.", "Success");
  }

  copyInvitation() {
    this.fanspace_name = localStorage.getItem(
      LocalstorageKeyEnum.SELECTED_FANSPACE_NAME
    );
    let copyText = `${
      this.fanspace_name
    } is inviting you to a scheduled event on Billions:

        ${this.event.eventName}
        ${
          this.event.scheduleStartTime
            ? this.datepipe.transform(this.event.scheduleStartTime, "MMMM d")
            : ""
        } ${
      this.event.scheduleStartTime
        ? this.datepipe.transform(this.event.scheduleStartTime, "h:mm a")
        : ""
    } 

        Join on your computer

        link : ${this.invite_link}`;

    const el = document.createElement("textarea");
    el.value = copyText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    this.toastr.success("Invitation copied to clipboard.", "Success");
  }

  // Invite actions end
  publishUnpublishEvent(value) {
    this.loading = true;
    let payload = {
      event_id: this.event.eventId,
      is_published: value,
    };

    this.eventService.publishUnpublishEvent(payload).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          this.event.isPublished = response.data.event.isPublished;

          //this.toastr.success(response.message, "Success");
          this.modalRef.close();
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
      }
    );
  }

  resetStartEventFormGroup() {
    this.controlContainerSubmissionService.submitted.next(false);
    this.startEventFG.reset();
    this.startEventFG.patchValue({
      display_name: this.user.display_name,
      tag_line: this.user.tag_line,
      is_available_for_sidechat: true,
    });
  }

  submitStartEventForm(valid, content) {
    this.loading = false;
    if (valid) {
      this.modalRef.close();
      this.activeBox = this.boxes.join_event_step2_box;
      this.openModel(content, "start_event_window , event_continue");
    } else {
      return;
    }
  }

  closeStartEventModal() {
    this.modalRef.close();
    this.resetStartEventFormGroup();
  }

  startEvent() {
    this.serverError = null;

    if (this.startEventFG.valid) {
      this.loading = true;

      let value = {
        ...this.startEventFG.value,
        event_id: this.event.eventId,
      };

      this.eventService.startEvent(value).subscribe(
        async (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
            this.modalRef.close();
            this.isAvailableForSidechat =
              response.data.participant.isAvailableForSidechat;
            this.event = response.data.event;

            let user: UserInterface = getUserFromLocalStorage();

            if (
              user.display_name !== this.startEventFG.value.display_name ||
              user.tag_line !== this.startEventFG.value.tag_line
            ) {
              user.display_name = this.startEventFG.value.display_name;
              user.tag_line = this.startEventFG.value.tag_line;
              setUserIntoLocalStorage(user);

              this.dataShareService.updatedUserDetails(user);
            }
            this.resetStartEventFormGroup();

            //update event status & participent binding
            this.participants.push(response.data.participant);
            this.agoraRTCStreamHandler.eventParticipants = this.participants;
            this.fake_array.pop();

            this.subscribeToEventChannels();
            await this.startAgoraHandling();
          } else {
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
          this.activeBox = this.boxes.join_event_step1_box;
        },
        (err: HttpErrorResponse) => {
          this.loading = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
    }
  }

  async endEvent() {
    this.serverError = null;

    if (this.event && this.event.eventStatus == this.event_statuses.STARTED) {
      this.loading = true;

      let value = {
        event_id: this.event.eventId,
      };

      this.eventService.endEvent(value).subscribe(
        async (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
            this.modalRef.close();

            this.event.eventStatus = this.event_statuses.ENDED;

            // end agora session first
            await this.agoraRTCStreamHandler.leaveRoomChannel();
            this.localStorageService.removeItem('micMuted');
            this.localStorageService.removeItem('cameraMuted');
            //redirect to feedback screen
            this.router.navigate(["/event", "feedback", this.event.eventCode], {
              replaceUrl: true,
            });
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
        }
      );
    }
  }

  unlockEvent(content) {
    this.modalRef.close();
    this.openModel(content, "eventlock_modal_window");
  }

  openModel(content, class_name = "") {
    this.modalRef = this.modalService.open(content, {
      windowClass: class_name,
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  // setOnAir(media) {
  //   this.onAir = this.onAir === media ? "" : media;

  //   this.selectedMedia.media = this.onAir;
  //   this.selectedMedia.visual_type = 0;

  //   this.mediaChangedHandler(this.selectedMedia);
  // }

  setBackground(media) {
    //this.bgLoader = true;
    this.selectedBackground = this.selectedBackground === media ? "" : media;

    this.selectedMedia.media = this.selectedBackground;
    this.selectedMedia.visual_type = this.visual_types.BACKGROUND;

    this.mediaChangedHandler(this.selectedMedia);
  }

  setOverlay(media) {
    //this.overlayImageLoader = true;
    this.selectedOverlay = this.selectedOverlay === media ? "" : media;

    this.selectedMedia.media = this.selectedOverlay;
    this.selectedMedia.visual_type = this.visual_types.OVERLAY;

    this.mediaChangedHandler(this.selectedMedia);
  }

  setProfileCardBannerChanged(banner, event_visual_id) {
    let previous_selected_profile_banner = this.selectedProfileCardBanner;

    this.selectedProfileCardBanner =
      this.selectedProfileCardBanner === banner ? "" : banner;

    if (event_visual_id) {
      this.serverError = null;
      //this.loading = true;
      //this.profileCardLoader = true;

      let value = {
        event_visual_id: event_visual_id,
        visual_type: this.visual_types.PROFILE_CARD_BANNER,
        is_active: this.selectedProfileCardBanner ? true : false,
      };

      let previous_selected =
        this.event_visuals.profile_card_banner_visuals.find(
          (item) => item.isActive == true
        );

      //handle active deactive
      let profile_card_banner_visuals =
        this.event_visuals.profile_card_banner_visuals.map((item) =>
          item.isActive ? { ...item, isActive: false } : item
        );

      if (value.is_active) {
        profile_card_banner_visuals = profile_card_banner_visuals.map((item) =>
          item.eventVisualId == event_visual_id
            ? { ...item, isActive: true }
            : item
        );
      }
      this.event_visuals.profile_card_banner_visuals =
        profile_card_banner_visuals;

      this.eventService.setUnsetVisual(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.profileCardLoader = false;
            //this.toastr.success(response.message, "Success");
            ////handle active deactive
            //let profile_card_banner_visuals =
            //  this.event_visuals.profile_card_banner_visuals.map((item) =>
            //    item.isActive ? { ...item, isActive: false } : item
            //  );
            //if (value.is_active) {
            //  profile_card_banner_visuals = profile_card_banner_visuals.map(
            //    (item) =>
            //      item.eventVisualId == event_visual_id
            //        ? { ...item, isActive: true }
            //        : item
            //  );
            //}
            //this.event_visuals.profile_card_banner_visuals =
            //  profile_card_banner_visuals;
          } else {
            this.serverError = response.message;
            //this.profileCardLoader = false;
            this.toastr.error(this.serverError, "Error");

            //handle active deactive
            let profile_card_banner_visuals =
              this.event_visuals.profile_card_banner_visuals.map((item) =>
                item.isActive ? { ...item, isActive: false } : item
              );

            if (previous_selected) {
              profile_card_banner_visuals = profile_card_banner_visuals.map(
                (item) =>
                  item.eventVisualId == previous_selected.eventVisualId
                    ? { ...item, isActive: true }
                    : item
              );
            }
            this.event_visuals.profile_card_banner_visuals =
              profile_card_banner_visuals;
            this.selectedProfileCardBanner = previous_selected_profile_banner;
          }
        },
        (err: HttpErrorResponse) => {
          this.loading = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");

          //handle active deactive
          let profile_card_banner_visuals =
            this.event_visuals.profile_card_banner_visuals.map((item) =>
              item.isActive ? { ...item, isActive: false } : item
            );

          if (previous_selected) {
            profile_card_banner_visuals = profile_card_banner_visuals.map(
              (item) =>
                item.eventVisualId == previous_selected.eventVisualId
                  ? { ...item, isActive: true }
                  : item
            );
          }
          this.event_visuals.profile_card_banner_visuals =
            profile_card_banner_visuals;
          this.selectedProfileCardBanner = previous_selected_profile_banner;
        }
      );
    }
  }

  setAdvertiseCarouelBanner(
    banner,
    ad_carousel_id,
    current_status,
    redirectUrl
  ) {
    let previous_selected_banner = this.selectedAdvertiseCarouselBanner;
    let previous_selected_banner_redirect_url =
      this.advertisecarouselBannerRedirectUrl;

    this.selectedAdvertiseCarouselBanner =
      this.selectedAdvertiseCarouselBanner === banner ? "" : banner;

    this.advertisecarouselBannerRedirectUrl = redirectUrl ? redirectUrl : "";

    if (ad_carousel_id) {
      this.serverError = null;
      // this.loading = true;
      //this.advertiseCarouselLoader = true;

      let value = {
        event_ad_carousel_id: ad_carousel_id,
        is_active: this.selectedAdvertiseCarouselBanner ? true : false,
        //!current_status
      };

      let previous_selected = this.advertise_carousel_banners.find(
        (item) => item.isActive == true
      );

      //handle active deactive
      let ad_carousel_banners = this.advertise_carousel_banners.map((item) =>
        item.isActive ? { ...item, isActive: false } : item
      );

      if (value.is_active) {
        ad_carousel_banners = ad_carousel_banners.map((item) =>
          item.eventAdCarouselId == ad_carousel_id
            ? { ...item, isActive: true }
            : item
        );
      }
      this.advertise_carousel_banners = ad_carousel_banners;

      this.eventService.setUnsetAdvertiseCarouselBanner(value).subscribe(
        (response: any) => {
          //this.advertiseCarouselLoader = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
            ////handle active deactive
            //let ad_carousel_banners = this.advertise_carousel_banners.map(
            //  (item) => (item.isActive ? { ...item, isActive: false } : item)
            //);
            //if (value.is_active) {
            //  ad_carousel_banners = ad_carousel_banners.map((item) =>
            //    item.eventAdCarouselId == ad_carousel_id
            //      ? { ...item, isActive: true }
            //      : item
            //  );
            //}
            //this.advertise_carousel_banners = ad_carousel_banners;
          } else {
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");

            //handle active deactive
            let ad_carousel_banners = this.advertise_carousel_banners.map(
              (item) => (item.isActive ? { ...item, isActive: false } : item)
            );

            if (previous_selected) {
              ad_carousel_banners = ad_carousel_banners.map((item) =>
                item.eventAdCarouselId == previous_selected.eventAdCarouselId
                  ? { ...item, isActive: true }
                  : item
              );
            }
            this.advertise_carousel_banners = ad_carousel_banners;
            this.selectedAdvertiseCarouselBanner = previous_selected_banner;
            this.advertisecarouselBannerRedirectUrl =
              previous_selected_banner_redirect_url;
          }
        },
        (err: HttpErrorResponse) => {
          //this.advertiseCarouselLoader = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");

          //handle active deactive
          let ad_carousel_banners = this.advertise_carousel_banners.map(
            (item) => (item.isActive ? { ...item, isActive: false } : item)
          );

          if (previous_selected) {
            ad_carousel_banners = ad_carousel_banners.map((item) =>
              item.eventAdCarouselId == previous_selected.eventAdCarouselId
                ? { ...item, isActive: true }
                : item
            );
          }
          this.advertise_carousel_banners = ad_carousel_banners;
          this.selectedAdvertiseCarouselBanner = previous_selected_banner;
          this.advertisecarouselBannerRedirectUrl =
            previous_selected_banner_redirect_url;
        }
      );
    }
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-05-28
   * @Description: use this function to open comman profile model
   **/
  openProfileImgModal() {
    const refModal = this.modalService.open(ProfileImgModalComponent, {
      backdrop: "static",
      keyboard: false,
      windowClass: "profile_change",
      centered: true,
    });
    refModal.componentInstance.profilePicture = this.profilePicture;
    refModal.componentInstance.userId = this.user.user_id;
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-07
   * @Description: serach user from event join list user
   **/
  onSearchChange(searchValue: string = "") {
    let filterRes = this.all_participants;

    if (searchValue != "" || this.isSidechat || this.isBookmark) {
      filterRes = this.all_participants.filter((participant) => {
        let nameRes = true;
        if (searchValue) {
          nameRes =
            participant.user.displayName
              .toLowerCase()
              .includes(searchValue.toLowerCase()) ||
            participant.user.tagLine
              .toLowerCase()
              .includes(searchValue.toLowerCase()) ||
            participant.user.fullName
              .toLowerCase()
              .includes(searchValue.toLowerCase()) ||
            participant.user.biography
              .toLowerCase()
              .includes(searchValue.toLowerCase()) ||
            participant.user.city
              .toLowerCase()
              .includes(searchValue.toLowerCase());
        }

        let chatRes = true;
        if (this.isSidechat) {
          chatRes = participant.isAvailableForSidechat == true;
        }

        let bookRes = true;
        if (this.isBookmark) {
          bookRes =
            this.bookmark_user.length > 0
              ? this.bookmark_user.includes(participant.user.userId)
              : false;
        }
        return nameRes && chatRes && bookRes ? true : false;
      });
    }

    let fakeCount = this.all_participants.length - filterRes.length;
    let temp_fake_array = Array.from(Array(fakeCount), (x, index) => index + 1);

    this.participants = filterRes;
    this.filter_fake_array = temp_fake_array;
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-09
   * @Description: filter sidechat from event join list user
   **/
  availableSideChatFilter(searchValue: string) {
    this.isSidechat = !this.isSidechat;
    this.onSearchChange(searchValue);
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-10
   * @Description: filter bookmark from event join list user
   **/
  bookmarkFilter(searchValue: string) {
    this.isBookmark = !this.isBookmark;
    this.bookmark_user = [];

    if (!this.isBookmark) {
      this.onSearchChange(searchValue);
      return;
    }

    //call api and get bookmark user list array
    this.eventService.getBookmarkUsers().subscribe(
      (response: any) => {
        if (response?.is_success && response.data) {
          this.bookmark_user = response.data;
          this.onSearchChange(searchValue);
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

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-09
   * @Description: clear filter data
   **/
  clearFilter() {
    this.isSidechat = false;
    this.isBookmark = false;
    this.onSearchChange();
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-22
   * @Description: messanger user list filter with event user list in sidechat
   **/
  messagerUserFilter() {
    let list = this.participants.map(function (x) {
      return x.user.userId;
    });
    this.dataShareService.changedEventParticipants({
      userList: list,
      blockedList: this.blockedList,
    });
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-24
   * @Description: get click event and if its inside popup than take action
   **/
  @HostListener("document:click", ["$event"])
  handleOutsideClick(event) {
    let target = event.target.closest("#filterPopup");
    if (target && !target.closest("#filterPopup").length) {
      this.filterShowEl?.nativeElement.click();
    }
  }

  // Change By Bigstep

  subscribeToEventChannels() {
    this.eventSocketService.connect().subscribe((x) => {});
    if (this.event.eventStatus == EventStatusEnum.STARTED) {
      this.eventSocketService
        .joinRoom(this.event.eventId)
        .subscribe((message) => {
          console.log("event socket join.", message);
        });

      // joining room for listening raise hand toggle event
      this.eventSocketService
        .joinRoom(this.user.user_id)
        .subscribe((message) => {
          console.log("user socket join.", message);
        });
      this.eventSocketService.listenEventJoined().subscribe((message) => {
        console.log("message from socket server ====>", message);
        if (
          message &&
          message.event_id &&
          message.event_id == this.event.eventId &&
          message.participant
        ) {
          this.participants = [...this.participants, message.participant];
          this.fake_array.pop();
          this.all_participants = this.participants;
          this.agoraRTCStreamHandler.eventParticipants = this.all_participants;
          //filter messanger user fn call
          this.messagerUserFilter();
        }
      });

      this.eventSocketService.listenEventLeaved().subscribe((message) => {
        console.log("message from socket server ====>", message);
        if (
          message &&
          message.event_id &&
          message.event_id == this.event.eventId &&
          message.user_id &&
          message.participant_id
        ) {
          this.participants = this.participants.filter(
            (participant) =>
              participant.eventParticipantId != message.participant_id
          );
          this.fake_array.push(this.fake_array.length + 1);
          this.all_participants = this.participants;
          this.agoraRTCStreamHandler.eventParticipants = this.all_participants;

          //filter messanger user fn call
          this.messagerUserFilter();

          //remove profile details if profile is selected of leved event participent...
          if (this.selectedAttendeeProfileId == message.user_id) {
            this.selectedAttendeeProfileId = "";
          }
        }
      });

      //get available for sidechat event trigger from socket
      this.eventSocketService
        .listenAvailableForSidechat()
        .subscribe((message) => {
          console.log("message from socket server ====>", message);
          if (
            message?.event_id &&
            message.event_id == this.event.eventId &&
            message.user_id
          ) {
            let index = this.participants.findIndex(
              (x) => x.user.userId === message.user_id
            );
            if (index >= 0) {
              this.participants[index].isAvailableForSidechat =
                message.available_for_sidechat;
              this.all_participants = this.participants;
            }
            this.isAvailableForSidechat = message.available_for_sidechat;
            this.dataShareService.changedAvailableForSidechat(message);
          }
        });

      //get profile pic update event trigger from socket
      this.eventSocketService
        .listenUserProfileImageChanged()
        .subscribe((message) => {
          console.log("message from socket server ====>", message);
          if (
            message?.event_id &&
            message.event_id == this.event.eventId &&
            message.user_id
          ) {
            let index = this.participants.findIndex(
              (x) => x.user.userId === message.user_id
            );
            if (index >= 0) {
              this.participants[index].user.profilePicture = message.image_url;
              this.all_participants = this.participants;
              this.agoraRTCStreamHandler.eventParticipants =
                this.all_participants;
            }
            this.dataShareService.changedUserProfileImage(message);
          }
        });

      //get profile data update event trigger from socket
      this.eventSocketService
        .listenUserProfileDataChanged()
        .subscribe((message) => {
          console.log("message from socket server ====>", message);
          if (
            message?.event_id &&
            message.event_id == this.event.eventId &&
            message.user.userId
          ) {
            let index = this.participants.findIndex(
              (x) => x.user.userId === message.user?.userId
            );
            if (index >= 0) {
              this.participants[index].user.displayName =
                message.user.displayName;
              this.participants[index].user.fullName = message.user.fullName;
              this.participants[index].user.biography = message.user.biography;
              this.participants[index].user.city = message.user.city;
              this.participants[index].user.tagLine = message.user.tagLine;
              this.all_participants = this.participants;
              this.agoraRTCStreamHandler.eventParticipants =
                this.all_participants;
            }
            this.dataShareService.changedUserProfileData(message);
          }
        });

      //remove deactivated user from event by socket trigger
      this.eventSocketService
        .listenDeactivateEventUser()
        .subscribe((message) => {
          console.log("message from socket server ====>", message);
          if (
            message?.event_id &&
            message.event_id == this.event.eventId &&
            message.user_id
          ) {
            this.participants = this.participants.filter(
              (participant) =>
                participant.eventParticipantId != message.participant_id
            );
            this.fake_array.push(this.fake_array.length + 1);
            this.all_participants = this.participants;
          }
        });

      //get event live chat update event trigger from socket
      this.eventSocketService
        .listenEventLiveChatChanged()
        .subscribe((message) => {
          console.log("message from socket live chat ====>", message);
          if (message?.event_id && message.event_id == this.event.eventId) {
            this.dataShareService.changedEventLiveChat(message);
          }
        });

      //get event side chat audio update event trigger from socket
      this.eventSocketService
        .listenEventSideChatAudioChanged()
        .subscribe((message) => {
          console.log("message from socket side chat a====>", message);
          if (message?.event_id && message.event_id == this.event.eventId) {
            this.dataShareService.changedEventSideChatAudio(message);
          }
        });

      //get event side chat video update event trigger from socket
      this.eventSocketService
        .listenEventSideChatVideoChanged()
        .subscribe((message) => {
          console.log("message from socket side chat v====>", message);
          if (message?.event_id && message.event_id == this.event.eventId) {
            this.dataShareService.changedEventSideChatVideo(message);
          }
        });

      this.eventSocketService.listenOnSidechatCall().subscribe((message) => {
        console.log("message from socket server okkkk ====>", message);
        if (message?.sender_id && message.receiver_id) {
          let index = this.participants.findIndex(
            (x) => x.user.userId === message.sender_id
          );
          if (index >= 0) {
            this.participants[index].sidechatCall = message.sidechat_call;
            this.all_participants = this.participants;
          }

          index = this.participants.findIndex(
            (x) => x.user.userId === message.receiver_id
          );
          if (index >= 0) {
            this.participants[index].sidechatCall = message.sidechat_call;
            this.all_participants = this.participants;
          }
          this.dataShareService.changedOnSideChatCall(message);
        }
      });

      this.eventSocketService.listenOffSidechatCall().subscribe((message) => {
        console.log("message from socket server okkkk ====>", message);
        if (message?.sidechat_call) {
          const call_participents = message.users;
          call_participents.forEach((participant_id) => {
            let index = this.participants.findIndex(
              (x) => x.user.userId === participant_id
            );
            if (index >= 0) {
              this.participants[index].sidechatCall = null;
              this.all_participants = this.participants;
            }
          });
          if (
            call_participents.includes(this.user.user_id) ||
            message?.sidechat_call?.endTime
          ) {
            this.sideCallRoom = null;
            this.isSidePanelRoom = false;
            // if (message?.sidechat_call?.endTime) {
            //   this.sideCallRoom = null;
            //   this.isSidePanelRoom = false;
            // } else this.sideCallRoom = message.sidechat_call;
          }
          this.dataShareService.changedOffSideChatCall(message);
        }
      });

      //get lock sidechat room event trigger from socket
      this.eventSocketService.listenLockSidechatCall().subscribe((message) => {
        console.log("message from socket server ====>", message);
        if (message) {
          const call_participents = message.call_participents;
          call_participents.forEach((participant_id) => {
            let index = this.participants.findIndex(
              (x) => x.user.userId === participant_id
            );
            if (index >= 0) {
              this.participants[index].sidechatCall = message.sidechat_call;
              this.all_participants = this.participants;
            }
          });
          if (call_participents.includes(this.user.user_id)) {
            this.sideCallRoom = message.sidechat_call;
          }
          this.dataShareService.changedLockSideChatRoom(message);
        }
      });

      //get available for sidechat event trigger from socket
      this.eventSocketService
        .listenAvailableForLiveQA()
        .subscribe((message) => {
          console.log("message from socket server ====>", message);
          if (message?.event_id && message.event_id == this.event.eventId) {
            let index = this.participants.findIndex(
              (x) => x.user.userId === message?.participant?.user?.userId
            );
            if (index >= 0) {
              this.participants[index].raisedHand = message.raised_hand;
              this.all_participants = [...this.participants];
            }
          }
        });

      this.agoraRTCStreamHandler.activeEventId = this.event.eventId;
    }
  }

  // BigStep Changes

  async resetAgoraToMediaPanel(type) {
    // this.broadcastLiveEventState({
    //   removeRemoteUserID:
    //     (this.agoraRTCStreamHandler.isVideoEnabled && this.user.user_id) || "",
    // });
    await this.agoraRTCStreamHandler.handleSwitchLocalAgoraStream(
      "goRight",
      `${this.user.user_id}${type === "agorascreen" ? "s" : ""}-local_stream`,
      type
    );
  }

  async setOnAir(type, mediaRef, mode = false) {
    if (type === "externalMedia") {
      await this.toggleExternalMediaOnAir(type, mediaRef, mode);
    } else {
      if (this.event.eventStatus !== EventStatusEnum.STARTED) return;
      if (this.switchStreamInProcess) return;
      if (type !== "agorascreen") {
        this.switchStreamInProcess = true;
      }
      await this.toggleLocalMediaOnAir(type, mediaRef, mode);
    }

    // const updatedAgoraLiveMedia = this.getUpdatedAgoraLiveMedias();
    // broadcast event onAir Content Change Event
    this.broadcastLiveEventState({
      media: this.media,
      contentType: this.content_type_middle,
      // moderator_uid: this.getModeratorStreamId(), // if moderator local agora / screen share / youtube stream is active only then set it
      // activeLiveAgoraMedia: updatedAgoraLiveMedia,
      moderator_active_mode:
        (this.agoraRTCStreamHandler.isVideoEnabled && "video") ||
        (this.agoraRTCStreamHandler.isAudioEnabled && "audio") ||
        "",
      moderatorWithCommentry: this.moderatorOnCommentry,
      attendeeWithCommentry: this.attendeeOnCommentry,
    });
    this.switchStreamInProcess = false;
  }

  async toggleModeratorAudioOnAir(toggleAudioStream = true) {
    if (this.event.eventStatus !== EventStatusEnum.STARTED) return;
    // first check if moderator is live on Air then take off from onAir
    // if (this.agoraRTCStreamHandler.isVideoEnabled) {
    //   await this.setOnAir("agora", this.user.user_id);
    // }

    if(this.moderatorOnCommentry)
      this.moderatorOnCommentry = false;
    this.isModeratorAudioOnly = !this.isModeratorAudioOnly;
    // setting up moderator audio mode only to event state.
    const prevModeratorActiveMode =
      this.agoraRTCStreamHandler.activeEventState?.data?.moderator_active_mode;

    if (toggleAudioStream)
      // either going off from on air or coming in audio mode
      this.broadcastLiveEventState({
        moderator_active_mode:
          (this.isModeratorAudioOnly && "audio") ||
          (prevModeratorActiveMode === "audio" ? "" : prevModeratorActiveMode),
        moderatorWithCommentry: this.moderatorOnCommentry,
      });

    if (this.isModeratorAudioOnly) {
      await this.agoraRTCStreamHandler.switchVideoToAudio();
      this.agoraRTCStreamHandler.playLocalStream(
        `${this.user.user_id}-local_stream`
      );
      this.isSidePanelRoom = false;
      this.moderatorOnCommentry = false;
    }
    // take off moderator as audio
    else if (toggleAudioStream) await this.agoraRTCStreamHandler.leaveOnAir();
  }

  async broadcastLiveEventState(broadcastData) {
    // update existing event state
    await this.agoraRTCStreamHandler.setActiveEventState({
      event_id: this.event.eventId,
      data: broadcastData.data || broadcastData,
    });
    // // set the moderator end
    // this.setLiveSceneVolume();
    this.eventSocketService
      .broadcastLiveEventState({
        event_id: this.event.eventId,
        data: this.agoraRTCStreamHandler.activeEventState.data,
      })
      .subscribe((data) => {
        console.log(data, "event sent data");
      });
  }

  // getModeratorStreamId() {
  //   switch (this.content_type_middle) {
  //     case "default":
  //       return "";
  //     case "externalMedia":
  //       return this.user.user_id;
  //     case "agora" || "agorascreen": {
  //       // check if moderator local agora / agorascreen active
  //       if (
  //         !this.agoraRTCStreamHandler.isScreenSharePublished &&
  //         !this.agoraRTCStreamHandler.isVideoEnabled
  //       ) {
  //         return "";
  //       }
  //       return this.user.user_id;
  //     }
  //   }
  //   return "";
  // }

  async toggleLocalMediaOnAir(type, agoraUserId, mode) {
    // first check if moderator is on Air with audio mode then reset it
    if (this.isModeratorAudioOnly && type === "agora") {
      await this.toggleModeratorAudioOnAir(false);
    }

    // if the type is same as previous

    if (type === "agorascreen" && this.content_type_middle === type) {
      this.resetAgoraToMediaPanel(type);
      this.content_type_middle = "";
      return;
    }

    if (
      mode === this.moderatorOnCommentry &&
      this.agoraRTCStreamHandler.isVideoEnabled &&
      type === "agora"
    ) {
      // reset to default state
      await this.resetAgoraToMediaPanel(type);
      if (mode) this.moderatorOnCommentry = !mode;
      //check if there are remote streams exist
      if (
        type === "agora" &&
        this.agoraRTCStreamHandler.getNumberOfUserOnAirWithoutAgoraScreen()
      )
        return true;
      if(this.content_type_middle === 'agora')
        this.content_type_middle = "";
    } else {
      // moderator on air without commentary
      if (!mode) {
        // reset agorascreen or externalMedia
        this.media = "";
        let updateVolumeState = {
          mediaVolume: 100,
        };
        this.agoraRTCStreamHandler.setActiveEventState(updateVolumeState)
        if (this.content_type_middle === "agorascreen")
          this.resetAgoraToMediaPanel("agorascreen");
        this.content_type_middle = type;
      }

      if (type === "agora") this.moderatorOnCommentry = mode;

      // type is agorascreen
      if (type === "agorascreen") {
        //reset other media if active
        this.onScreenSceneActiveState = false;
        this.media = "";
        if (!(mode || this.moderatorOnCommentry))
          this.resetAgoraToMediaPanel("agora");
        await this.startScreenShare();
      } else {
        // reset side call room if open
        this.isSidePanelRoom = false;
        await this.agoraRTCStreamHandler.handleSwitchLocalAgoraStream(
          "goLive",
          "video_streaming",
          type
        );
      }
    }
  }

  async toggleExternalMediaOnAir(type, mediaUrl, mode) {
    // if the type is same as previous
    if (mediaUrl === this.media) {
      this.media = "";
      // this.mediaChangedHandler(this.selectedMedia);
      this.content_type_middle =
        this.content_type_middle === type ? "" : "agora";
    } else {
      this.media = mediaUrl;
      // switch agora stream back to right panel if agora was in middle
      this.onScreenSceneActiveState = false;
      if (
        this.content_type_middle === "agorascreen" ||
        this.agoraRTCStreamHandler.isScreenShareEnabled
      )
        this.resetAgoraToMediaPanel("agorascreen");
      if (this.content_type_middle === "agora" && !this.moderatorOnCommentry)
        this.resetAgoraToMediaPanel(this.content_type_middle);

      this.content_type_middle = "externalMedia";
    }
  }

  // Add Live Media

  openAddLiveMediaModel(content) {
    this.openModel(content, "images_changes_modal");
  }

  // save Live Media

  async saveLiveMedia() {
    // special case: If live media is screen share then first share the screen then proceed to add screen media to media library
    let mediaUrl;
    if (this.activeLiveMediaTab === "screenShare") {
      this.liveMediaUrl = this.activeLiveMediaTab;
      mediaUrl = this.liveMediaUrl;
      // await this.startScreenShare();
      if (!this.agoraRTCStreamHandler.isScreenShareEnabled) return; //We will only add screen share media once user is shared screen
    } else {

      mediaUrl = extractYoutubeCode(this.liveMediaUrl);
      // html media link
      if(!mediaUrl)
        mediaUrl = this.liveMediaUrl;
    }

    this.error_message = "";
    if (!mediaUrl) {
      this.error_message = "Please Enter Valid Live Media Url";
      return;
    }
    this.loading = true;

    const formdata = new FormData();

    formdata.append("event_id", this.event.eventId);
    formdata.append("url", mediaUrl);
    this.eventService.addEventLiveMedia(formdata).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          if (response.data) {
            //this.toastr.success(response.message, "Success");
            this.liveMedias.push(response.data.eventLiveMedias[0]);
            this.prepareLiveMedias();
            if (this.liveMediaUrl === "screenShare") {
              this.startScreenShare();
            }
            this.liveMediaUrl = "";

            this.modalRef.close();
          }
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.loading = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }

  // add to live media
  prepareLiveMedias(pageLoad = false) {
    this.checkOverflow();
    this.liveMediaUrls = [];
    let screenShareIndex = 0;
    for (let media of this.liveMedias) {
      let mediaUrl = `${media.url}#${media.eventLiveMediaId}`;
      if (media.url === "screenShare") {
        this.isScreenShareMediaAdded = true;
        // start screem share
        // if (!pageLoad) this.startScreenShare();
        screenShareIndex = this.liveMediaUrls.length;
        mediaUrl = "";
      }
      this.liveMediaUrls.push({
        url: mediaUrl,
        videoId: media.url || "",
        eventLiveMediaId: media.eventLiveMediaId,
        title: media.title || "",
      });
    }
    // special case for screen share, This media has to be always on top in live medias
    if (screenShareIndex !== 0) {
      const otherLiveMedia = this.liveMediaUrls[0];
      this.liveMediaUrls[0] = this.liveMediaUrls[screenShareIndex];
      this.liveMediaUrls[screenShareIndex] = otherLiveMedia;
    }
    // reset active media tab
    this.activeLiveMediaTab = "addLink";
  }

  // start screen share
  async startScreenShare(elementId: string = "") {
    const contentTypeMiddle =
      this.content_type_middle?.indexOf("agorascreen") !== -1;
    // if the media was screen share then play it
    await this.agoraRTCStreamHandler.startScreenSharing(
      this.event.eventId,
      contentTypeMiddle
    );
    if (!contentTypeMiddle) {
      setTimeout(() => {
        this.agoraRTCStreamHandler.playScreenShareStream(
          elementId || this.user.user_id + "s-local_stream"
        );
      }, 0);
    }
  }

  async startAgoraHandling() {
    const activeEventState = this.agoraRTCStreamHandler.activeEventState.data;
    // set attendee Live Mode if applicable
    this.onScreenSceneActiveState = activeEventState?.attendeeVideoMode;
    this.onAudioSceneActiveState = activeEventState?.attendeeAudioMode;
    let publishModerator = false;
    let publishMode = ""; //publish with video & audio
    // close testing camera mic tracks before starting actual live stream

    await this.agoraRTCStreamHandler.closeCameraMic();

    await this.agoraRTCStreamHandler.initializeAgoraClient();

    if (this.event.eventStatus == EventStatusEnum.STARTED) {
      // Join the room
      await this.agoraRTCStreamHandler.joinRoomChannel();

      // check whether the moderator was live before refresh screen if yes then in which mode
      if (activeEventState?.moderator_active_mode === "audio") {
        await this.agoraRTCStreamHandler.startScene("audio");
        publishModerator = true;
        publishMode = "audio";
        this.isModeratorAudioOnly = true;
      }

      if (activeEventState?.moderator_active_mode === "video") {
        await this.agoraRTCStreamHandler.startScene("");
      }
    }
    // subscribe to screenshare event
    this.castScreenShareSubscription =
      this.agoraRTCStreamHandler.castScreenShare.subscribe((data) => {
        if (
          data?.action === "stop" &&
          this.content_type_middle?.indexOf("agorascreen") !== -1
        ) {
          this.setOnAir(this.content_type_middle, this.user.user_id);
        }
      });

    // subscribe to event streaming content change event
    this.eventSocketService
      .listenCurrentStreamingContentChanged()
      .subscribe((data: BroadcastStreamingContent) => {
        // update live media status
        this.agoraRTCStreamHandler.setActiveEventState({
          event_id: this.event.eventId,
          data: { ...data.data },
        });
        // this.handleLiveEventStateChange(data);
      });

    // // set the moderator end
    // this.setLiveSceneVolume();
    this.switchStreamInProcess = false;
    this.initialRender = false;
    this.agoraRTCStreamHandler.playLocalStream(
      `${this.user.user_id}-local_stream`
    );
  }

  async toggleOnScreenScene(mode = false) {
    this.onAudioSceneActiveState = false;
    if (this.attendeeOnCommentry !== mode) {
      this.onScreenSceneActiveState = true;
    } else if (!mode) {
      this.onScreenSceneActiveState = !this.onScreenSceneActiveState;
    } else {
      this.onScreenSceneActiveState = false;
    }

    if (mode && this.attendeeOnCommentry) this.attendeeOnCommentry = false;
    else this.attendeeOnCommentry = mode;

    this.showAttendeeLoader();
    if (this.onScreenSceneActiveState) {
      await this.activateTab(this.tabs.block_live_qa);
    } else {
      this.deactivateTab();
    }
    let contentTypeMiddle = this.content_type_middle;
    if (this.onScreenSceneActiveState) {
      if (this.content_type_middle === "") contentTypeMiddle = "agora";
      else contentTypeMiddle = this.content_type_middle;
    }

    if (!mode && this.onScreenSceneActiveState) {
      this.media = "";
      let updateVolumeState = {
        mediaVolume: 100,
      };
      this.agoraRTCStreamHandler.setActiveEventState(updateVolumeState)
      if (this.content_type_middle === "agorascreen")
        this.resetAgoraToMediaPanel(this.content_type_middle);
      contentTypeMiddle = "agora";
    }
    this.content_type_middle = contentTypeMiddle;
    this.broadcastLiveEventState({
      attendeeVideoMode:
        this.onScreenSceneActiveState || this.attendeeOnCommentry,
      attendeeAudioMode: this.onAudioSceneActiveState,
      contentType: contentTypeMiddle,
      moderatorWithCommentry: this.moderatorOnCommentry,
      attendeeWithCommentry: this.attendeeOnCommentry,
    });
  }

  async toggleOnAudioScene() {
    this.onAudioSceneActiveState = !this.onAudioSceneActiveState;
    this.onScreenSceneActiveState = false;
    this.attendeeOnCommentry = false;
    this.showAttendeeLoader();
    if (this.onAudioSceneActiveState) {
      await this.activateTab(this.tabs.block_live_qa);
    } else {
      this.deactivateTab();
    }
    this.broadcastLiveEventState({
      attendeeVideoMode: this.onScreenSceneActiveState,
      attendeeAudioMode: this.onAudioSceneActiveState,
      attendeeWithCommentry: this.attendeeOnCommentry,
    });
  }

  getUserProfileImage() {
    return this.user.profile_picture || "/assets/image/user.svg";
  }

  async deleteLiveMedia(event, mediaId: string) {
    event.preventDefault();
    event.stopPropagation();

    this.eventService.deleteEventLiveMedia(mediaId).subscribe(
      async (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          // check if delete media was screen share then handle at agora end as well
          const screenShareMedia = this.liveMedias.find(
            (media) =>
              media.eventLiveMediaId === mediaId && media.url === "screenShare"
          );
          if (screenShareMedia) {
            this.isScreenShareMediaAdded = false;
            await this.agoraRTCStreamHandler.disableScreenShare();
          }
          // update existing live media
          if (this.liveMediaUrls.length)
            this.liveMedias = this.liveMedias.filter(
              (media) => media.eventLiveMediaId !== mediaId
            );
          this.prepareLiveMedias();
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.loading = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }

  preProcessEvent = async (content, class_name = "") => {
    // // start agora local session
    // await this.agoraRTCStreamHandler.initializeAgoraClient();

    //prepare before event start
    this.openModel(content, class_name);
  };

  onMediaTitleChange(evt, mediaId) {
    const mediaTitle = evt.target.value;

    // emits the `searchText` into the stream. This will cause the operators in its pipe function (defined in the ngOnInit method) to be run. `debounce` runs and then `map`. If the time interval of 1 sec in debounce hasn't elapsed, map will not be called, thereby saving the server from being called.
    this.mediaUpdate.next({ mediaTitle, mediaId });
  }

  updateMediaTitle(mediaInfo) {
    this.eventService
      .updateEventLiveMedia({
        event_live_media_id: mediaInfo.mediaId,
        title: mediaInfo.mediaTitle,
      })
      .subscribe();
  }

  identify(index, media) {
    return (media && media.eventLiveMediaId) || index;
  }

  isOverflown(element) {
    return element.scrollHeight > element.clientHeight;
  }

  checkOverflow() {
    setTimeout(() => {
      let element = document.getElementById("block_topbar_stream");
      this.setScrollButton = this.isOverflown(element);
    }, 500);
  }
  // BigStep Changes Ends Here

  //save carousel redirect url
  saveCarouselUrl(carouselId, bannerUrl, redirectUrl) {
    if (redirectUrl.trim()) {
      //this.carouselUrlEditLoader = true;

      //set parameter object
      let params = {
        ad_carousel_id: carouselId,
        redirect_url: redirectUrl.trim(),
      };

      //call api with parameter and handle reponse
      this.eventService.updateCarouselBannerRedirectUrl(params).subscribe(
        (response: any) => {
          //this.carouselUrlEditLoader = false;
          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
            this.carouselBannerId = 0;

            //if banner is current selected than update url
            if (this.selectedAdvertiseCarouselBanner == bannerUrl) {
              this.advertisecarouselBannerRedirectUrl =
                response.data.eventCarousel.redirectUrl;
            }
          } else {
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
        },
        (err: HttpErrorResponse) => {
          //this.carouselUrlEditLoader = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
    }
  }

  //set hide show box of ad carousel redirect url
  editCarouselUrlToggale(id) {
    this.carouselBannerId = id;
  }
  showAttendeeLoader() {
    this.attendeeActionLoader = true;
    setTimeout(() => {
      this.attendeeActionLoader = false;
    }, 3000);
  }

  //get event guest list
  getEventGuestsByEventId() {
    this.loading = true;
    this.eventService.getGuestsByEventId(this.event.eventId).subscribe(
      (response: any) => {
        this.loading = false;

        if (response && response.is_success) {
          this.eventGuests = response.data.guests;
          this.guestCount = response.data.count;
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
      }
    );
  }

  addGuests(guest_users) {
    this.add_guest_error_message = "";
    const check_value = guest_users.length - 1;
    if (guest_users[check_value].email && guest_users[check_value].name) {
      this.indexStart = false;
      if (guest_users.length >= 1) {
        this.indexStart = true;
      }
      this.guest_users().push(this.newGuest());
    } else {
      this.add_guest_error_message = "Please enter value";
      return;
    }
  }

  newGuest(): FormGroup {
    return this.FB.group({
      email: ["", [emailValidator()]],
      name: ["", [onlyTextAndSpace("Name")]],
    });
  }

  removeGuests(i: number) {
    this.guest_users().removeAt(i);
    if (this.guest_users().controls.length == 1) {
      this.indexStart = false;
    } else {
      this.indexStart = true;
    }
  }

  guest_users(): FormArray {
    return this.guestFG.get("guest_users") as FormArray;
  }

  deleteGuest(content, id) {
    this.modalRef = this.modalService.open(content, {
      windowClass: "guestdelete_window",
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
    this.deleteGuestId = id;
  }

  deleteGuestUser(id) {
    this.loading = true;
    this.eventService.deleteGuest(id).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, 'Success');
          this.modalRef.close();

          if (response.data && response.data.guest_user) {
            this.eventGuests = this.eventGuests.filter(
              (user) =>
                user.eventGuestUserId !=
                response.data.guest_user.eventGuestUserId
            );
            this.guestCount = this.eventGuests.length;
          }
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
      }
    );
  }

  submitGuestForm(valid, value) {
    this.add_guest_error_message = "";
    this.duplicate_guest_error_message = "";

    if (valid) {
      this.loading = true;

      let email_address = [];
      if (value.email_address) {
        email_address = value.email_address.split(",");
      }

      let guestuseremails = value.guest_users.map(
        (guestuser) => guestuser.email
      );
      guestuseremails = guestuseremails.filter(
        (email) => email !== null && email !== ""
      );

      let guestusernames = value.guest_users.map((guestuser) => guestuser.name);
      guestusernames = guestusernames.filter(
        (name) => name !== null && name !== ""
      );

      let allguestuseremails = guestuseremails.concat(email_address);
      const unique_guestuseremails = new Set(
        allguestuseremails.map((email) => email)
      );

      if (unique_guestuseremails.size < allguestuseremails.length) {
        this.loading = false;
        this.duplicate_guest_error_message = "Duplicates email not allow";
        return false;
      }

      let payload = {
        event_id: this.event.eventId,
        guest_users: [],
        email_address: "",
        reference_name: "",
      };

      if (
        value.guest_users.length > 0 &&
        !value.email_address &&
        !value.reference_name
      ) {
        const is_guests_valid = value.guest_users.every(
          (item) => item.email && item.name
        );

        if (!is_guests_valid) {
          this.loading = false;
          this.duplicate_guest_error_message = "Please enter value";
          return false;
        }
        payload.guest_users = value.guest_users;
      } else if (
        value.guest_users.length > 0 &&
        value.email_address &&
        value.reference_name
      ) {
        const is_guests_valid = value.guest_users.every(
          (item) => item.email && item.name
        );

        if (is_guests_valid) {
          payload.guest_users = value.guest_users;
          payload.email_address = value.email_address;
          payload.reference_name = value.reference_name;
        } else if (guestuseremails.length > 0 || guestusernames.length > 0) {
          this.loading = false;
          this.duplicate_guest_error_message = "Please enter value";
          return false;
        } else {
          payload.email_address = value.email_address;
          payload.reference_name = value.reference_name;
        }
      } else {
        this.loading = false;
        this.duplicate_guest_error_message = "Please enter value";
        return false;
      }

      this.eventService.addEventGuest(payload).subscribe(
        (response: any) => {
          this.loading = false;
          if (response && response.is_success) {
            if (response.data) {
              if (response.data.already_exist_guest_users.length > 0) {
                let existEmail = Array.prototype.map
                  .call(
                    response.data.already_exist_guest_users,
                    (res) => res.email
                  )
                  .toString();
                this.toastr.warning(
                  `Guest already exist  ${existEmail}`,
                  "Warning"
                );
              } else {
                //this.toastr.success(response.message, 'Success');
              }

              for (let created_guest of response.data.created_guest_users) {
                this.eventGuests.push(created_guest);
              }
              this.guestCount = this.eventGuests.length;
              this.guestFG.reset();
              this.guest_users().controls.splice(1);
              this.indexStart = false;
            }
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
        }
      );
    }
  }
}
