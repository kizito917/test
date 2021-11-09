import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  ElementRef,
} from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Router, ActivatedRoute } from "@angular/router";
import { NgbModalRef, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { DataShareService } from "src/app/shared/services/data-share-services/data-share.service";
import { EventStatusEnum } from "src/app/shared/enums/event-status.enum";
import {
  DashboardViewEnum,
  EventSocketService,
  LeaveComponentInterface,
  UserInterface,
  getUserFromLocalStorage,
  AuthService,
  EventService,
  MessengerInterface,
  LocalstorageKeyEnum,
  RoleEnum,
  AgoraRtcStreamHandlerService,
  AgoraRtcSidecallHandlerService,
  SocketService,
} from "src/app/shared";

import { Subscription } from "rxjs";
import { BroadcastStreamingContent } from "../../shared/interfaces/broadcast-streaming-content.interface";
import { EventScreenActionEnum } from "src/app/shared/enums/event-screen-action";
import { LiveQandAState } from "src/app/shared/enums/live-qanda-state.enum";

@Component({
  selector: "app-event-attendee-dashboard",
  templateUrl: "./event-attendee-dashboard.component.html",
  styleUrls: ["./event-attendee-dashboard.component.scss"],
})
export class EventAttendeeDashboardComponent
  implements OnInit, OnDestroy, LeaveComponentInterface
{
  view_state = DashboardViewEnum.CHAT_ONLY;
  views = {
    NONE: DashboardViewEnum.NONE,
    ALL: DashboardViewEnum.ALL,
    MEDIA_ONLY: DashboardViewEnum.MEDIA_ONLY,
    CHAT_ONLY: DashboardViewEnum.CHAT_ONLY,
  };

  carousel_setting = {
    is_ad_carousel_active: false,
    ad_carousel_interval: 20,
  };

  event_visuals = {
    profile_card_banner_visuals: [],
  };

  public isSidePanelRoom: boolean = false;
  public calle_id: string = null;
  public sideCallRoom: any = null;
  public calleInfo: any = null;

  /*ngb_tabs = {
        live_chat: 1,
        messenger: 2,
        calls: 3,
        profile: 4
    };*/

  media = "/assets/image/default-stream@2x.png";
  genericError = "service is not available. please try again later.";
  profile_card_banner = "";
  advertise_carousel_banner = "";
  advertisecarouselBannerRedirectUrl = "";
  searchString = "";
  event_code;
  shuffle;
  blockedList;

  event;
  selectedAttendeeProfileId = '';
  user: UserInterface;
  participants = [];
  all_participants = [];
  advertise_carousel_banners = [];
  filter_fake_array = [];
  bookmark_user = [];
  navigateToProfile = 1;
  messenger_indicator = 0;

  serverError: any = null;
  loading = false;
  is_fake: false;
  isModerator = false;
  isBookmark = false;
  isSidechat = false;
  isAvailableForSidechat = false;
  cardTextLimit = [30, 55];
  //fake_attendee_count ;
  isRaisedHand = true;
  audioPlayFailed: boolean = false;
  holdStateTimeoutRef: any;
  isOnAir: boolean = false;
  handleLeftScreen: boolean = false;

  fake_array = Array.from(Array(93), (x, index) => index + 1);

  private modalRef: NgbModalRef;
  @ViewChild("modelLeaveEvent") modelLeaveEvent: any;
  @ViewChild("filterShow") filterShowEl: ElementRef;
  public handlerRole = RoleEnum.ATTENDEE;

  roomStartSubscription: Subscription;
  castUpdateRemoteUserSubscription: Subscription;
  castHandleAutoPlayFailed: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private toastr: ToastrService,
    private dataShareService: DataShareService,
    private eventSocketService: EventSocketService,
    private modalService: NgbModal,
    private authService: AuthService,
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService,
    public sidecallService: AgoraRtcSidecallHandlerService,
    private socketService: SocketService
  ) {
    let selected_fanspace_role_id = localStorage.getItem(
      LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID
    );

    if (
      selected_fanspace_role_id &&
      parseInt(selected_fanspace_role_id) == RoleEnum.ATTENDEE
    ) {
      this.route.params.subscribe((params) => {
        if (params && params.event_code) {
          this.event_code = params.event_code;

          //call get event details + participants list
          this.getEventAttendeeDashboardDetails();
        } else {
          this.router.navigate(["not-found"]);
        }
      });
    } else {
      this.router.navigate(["/"]);
    }
    this.user = getUserFromLocalStorage();
  }

  ngOnInit() {
    this.brickStructure();
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
    this.agoraRTCStreamHandler.handlerRole = RoleEnum.ATTENDEE;

    // Subscribe to event where remote users are getting added or removed from live scene
    this.castUpdateRemoteUserSubscription =
      this.agoraRTCStreamHandler.castUpdateRemoteUser.subscribe((data) => {
        this.brickStructure(this.participants);
      });
    this.castHandleAutoPlayFailed =
      this.agoraRTCStreamHandler.castHandleAutoPlayFailed.subscribe((data) => {
        if (data) {
          this.audioPlayFailed = true;
        }
      });
    this.agoraRTCStreamHandler.castCallUserSelected.subscribe((data) => {
      if (data) {
        this.attendeeSelectedHandler(data);
      }
    });

    // listen socket connection state update
    this.socketService.castSocketConnectionState.subscribe((data) => {
      if (data === "disconnected") {
        // reconnect socket
        // this.eventSocketService.connect().subscribe((x) => {
        //   console.log("event socket re-connected.", x);
        // });
      }
    });
  }

  async ngOnDestroy() {
    if (this.event && this.event.eventId) {
      this.eventSocketService.leaveRoom(this.event.eventId);
      this.roomStartSubscription.unsubscribe();
    }

    //destory interval
    if (this.shuffle) {
      clearInterval(this.shuffle);
    }

    await this.agoraRTCStreamHandler.leaveOnAir();
    await this.agoraRTCStreamHandler.closeCameraMic();
    this.castUpdateRemoteUserSubscription.unsubscribe();
  }

  canLeaveComponent(): boolean {
    if (
      this.event &&
      this.event.eventStatus == EventStatusEnum.STARTED &&
      this.authService.isLoggedIn()
    ) {
      this.openModel(this.modelLeaveEvent, "eventleave_modal_window");
      return false;
    }
    return true;
  }

  viewChangedHandler(view_state) {
    this.view_state = view_state;
    this.onSearchChange();
  }

  leaveEventHandler(event_id) {
    this.leaveEvent();
  }

  getEventAttendeeDashboardDetails() {
    if (this.event_code) {
      this.eventSocketService.connect().subscribe((x) => {
        console.log("event socket connected.", x);
      });

      this.eventService
        .getEventAttendeeDashboardDetails(this.event_code)
        .subscribe(
          (response: any) => {
            if (response && response.is_success) {
              this.event = response.data.event;
              if (this.event.eventStatus == EventStatusEnum.STARTED) {
                this.participants = response.data.participants;
                this.blockedList = response.data.blocked_list;

                this.agoraRTCStreamHandler.eventParticipants =
                  this.participants;
                const currentParticipant = this.participants.find(
                  (participant) => participant.user.userId === this.user.user_id
                );
                this.isOnAir =
                  currentParticipant.liveQandAState === LiveQandAState.onAir;
                this.agoraRTCStreamHandler.setHoldStateData(
                  false,
                  currentParticipant.liveQandAState === LiveQandAState.onHold
                );
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
                }

                for (let i = 0; i < this.participants.length; i++) {
                  this.fake_array.pop();
                }

                //update is available for sidechat by input()
                let result = this.participants.find(
                  (x) => x.user.userId == this.user.user_id
                );

                this.isAvailableForSidechat = result
                  ? result.isAvailableForSidechat
                  : false;

                this.isRaisedHand = result ? result.raisedHand : true;

                // check if the logged in user is busy with side call
                if (result?.sidechatCall) {
                  this.sidecallService.leaveSideCallOnPageReload(
                    result.sidechatCall
                  );
                  this.sideCallRoom = null;
                }

                this.event_visuals = response.data.event_visuals;
                this.advertise_carousel_banners =
                  response.data.advertise_carousel_banners;

                this.carousel_setting.is_ad_carousel_active =
                  response.data.event.eventSetting.isAdCarouselActive;
                this.carousel_setting.ad_carousel_interval =
                  response.data.event.eventSetting.adCarouselInterval;

                this.dataShareService.changedEventStatus({
                  event_id: this.event.eventId,
                  event_status: this.event.eventStatus,
                  event_code: this.event.eventCode,
                });

                //filter messanger user fn call
                this.messagerUserFilter();

                //call fn and modify response and render
                this.brickStructure(this.participants);

                //shuffle participant in every 30 sec
                this.shuffle = setInterval(() => {
                  if (
                    (this.view_state == this.views.CHAT_ONLY ||
                      this.view_state == this.views.NONE) &&
                    this.participants.length > 1 &&
                    this.searchString == "" &&
                    !this.isSidechat &&
                    !this.isBookmark
                  ) {
                    let newPosition = this.participants
                      .map((first) => ({ sort: Math.random(), value: first }))
                      .sort((first, second) => first.sort - second.sort)
                      .map((first) => first.value);

                    this.brickStructure(newPosition);
                  }
                }, 30000);

                this.eventSocketService
                  .joinRoom(this.event.eventId)
                  .subscribe((message) => {
                    console.log("event socket join.", message);
                  });

                this.eventSocketService
                  .listenEventJoined()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.participant
                    ) {
                      this.participants.push(message.participant);
                      this.fake_array.pop();

                      //call messagerfilter and brickstructure fn for futhur action
                      this.brickStructure(this.participants);
                      this.messagerUserFilter();
                    }
                  });

                this.eventSocketService
                  .listenEventLeaved()
                  .subscribe((message) => {
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
                          participant.eventParticipantId !=
                          message.participant_id
                      );
                      this.fake_array.push(this.fake_array.length + 1);

                      //call messagerfilter and brickstructure fn to futhur action
                      this.brickStructure(this.participants);
                      this.messagerUserFilter();

                      //remove profile details if profile is selected of leved event participent...
                      if (this.selectedAttendeeProfileId == message.user_id) {
                        this.selectedAttendeeProfileId = '';
                      }
                    }
                  });

                this.eventSocketService
                  .listenEventEnded()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId
                    ) {
                      this.event.eventStatus = EventStatusEnum.ENDED;

                      //redirect to feedback screen
                      this.router.navigate(
                        ["/event", "feedback", this.event.eventCode],
                        { replaceUrl: true }
                      );
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
                      //redirect to home screen
                      if (this.user.user_id == message.user_id) {
                        this.event.eventStatus = EventStatusEnum.ENDED;
                        this.router.navigate(["/"]);
                        this.toastr.error(
                          "You have been deactivated by moderator",
                          "Error"
                        );
                      }

                      this.participants = this.participants.filter(
                        (participant) =>
                          participant.eventParticipantId !=
                          message.participant_id
                      );
                      this.fake_array.push(this.fake_array.length + 1);
                    }
                  });

                let index =
                  this.event_visuals.profile_card_banner_visuals.findIndex(
                    (x) => x.isActive == true
                  );

                if (index >= 0) {
                  this.profile_card_banner =
                    this.event_visuals.profile_card_banner_visuals[
                      index
                    ].fileName;
                }

                this.eventSocketService
                  .listenAttendeeProfileCardBannerChanged()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.event_visual_id
                    ) {
                      this.profile_card_banner = message.profile_card_banner;
                    }
                  });

                let i = this.advertise_carousel_banners.findIndex(
                  (x) => x.isActive == true
                );

                if (i >= 0) {
                  this.advertise_carousel_banner =
                    this.advertise_carousel_banners[i].fileName;

                  this.advertisecarouselBannerRedirectUrl =
                    this.advertise_carousel_banners[i].redirectUrl;
                }

                this.eventSocketService
                  .listenAdvertiseCarouselBannerChanged()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.event_ad_carousel_id
                    ) {
                      this.advertise_carousel_banner =
                        message.advertise_carousel_banner;
                      this.advertisecarouselBannerRedirectUrl =
                        message.redirect_url;
                    }
                  });

                this.eventSocketService
                  .listenAdvertiseCarouselSettingChanged()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.event_setting_id
                    ) {
                      //your logic goes here
                      this.carousel_setting.is_ad_carousel_active =
                        message.advertise_carousel_settings.is_ad_carousel_active;
                      this.carousel_setting.ad_carousel_interval =
                        message.advertise_carousel_settings.ad_carousel_interval;
                    }
                  });

                this.eventSocketService
                  .listenAdvertiseCarouselBannerDeleted()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.event_ad_carousel_id
                    ) {
                      //your logic goes here
                      this.advertise_carousel_banners =
                        this.advertise_carousel_banners.filter(
                          (item) =>
                            item.eventAdCarouselId !=
                            message.event_ad_carousel_id
                        );
                    }
                  });

                this.eventSocketService
                  .listenAdvertiseCarouselBannerAdded()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message &&
                      message.event_id &&
                      message.event_id == this.event.eventId &&
                      message.advertise_carousel_banners.length > 0
                    ) {
                      //your logic goes here
                      this.advertise_carousel_banners.push(
                        ...message.advertise_carousel_banners
                      );
                    }
                  });

                //get socket triger for update redirect url
                this.eventSocketService
                  .listenAdvertiseCarouselBannerRedirectUrlChanged()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (
                      message?.event_id &&
                      message.event_id == this.event.eventId &&
                      message.event_ad_carousel_id
                    ) {
                      //finde banner from array and update url
                      let item = this.advertise_carousel_banners.findIndex(
                        (i) =>
                          i.eventAdCarouselId == message.event_ad_carousel_id
                      );
                      this.advertise_carousel_banners[item].redirectUrl =
                        message.redirect_url;

                      //if current banner is match than updateurl
                      if (
                        this.advertise_carousel_banner ==
                        this.advertise_carousel_banners[item].fileName
                      ) {
                        this.advertisecarouselBannerRedirectUrl =
                          message.redirect_url;
                      }
                    }
                  });

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
                      }
                      this.isAvailableForSidechat =
                        message.available_for_sidechat;
                      this.dataShareService.changedAvailableForSidechat(
                        message
                      );
                    }
                  });

                //get profile update event trigger from socket
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
                        this.participants[index].user.profilePicture =
                          message.image_url;
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
                      message.user?.userId
                    ) {
                      let index = this.participants.findIndex(
                        (x) => x.user.userId === message.user.userId
                      );
                      if (index >= 0) {
                        this.participants[index].user.displayName =
                          message.user.displayName;
                        this.participants[index].user.tagLine =
                          message.user.tagLine;
                        this.participants[index].user.fullName =
                          message.user.fullName;
                        this.participants[index].user.biography =
                          message.user.biography;
                        this.participants[index].user.city = message.user.city;
                      }
                      this.dataShareService.changedUserProfileData(message);
                    }
                  });

                //get event live chat update event trigger from socket
                this.eventSocketService
                  .listenEventLiveChatChanged()
                  .subscribe((message) => {
                    console.log("message from socket live chat ====>", message);
                    if (
                      message?.event_id &&
                      message.event_id == this.event.eventId
                    ) {
                      this.dataShareService.changedEventLiveChat(message);
                    }
                  });

                //get event side chat audio update event trigger from socket
                this.eventSocketService
                  .listenEventSideChatAudioChanged()
                  .subscribe((message) => {
                    console.log(
                      "message from socket side chat a====>",
                      message
                    );
                    if (
                      message?.event_id &&
                      message.event_id == this.event.eventId
                    ) {
                      this.dataShareService.changedEventSideChatAudio(message);
                    }
                  });

                //get event side chat video update event trigger from socket
                this.eventSocketService
                  .listenEventSideChatVideoChanged()
                  .subscribe((message) => {
                    console.log(
                      "message from socket side chat v====>",
                      message
                    );
                    if (
                      message?.event_id &&
                      message.event_id == this.event.eventId
                    ) {
                      this.dataShareService.changedEventSideChatVideo(message);
                    }
                  });

                this.eventSocketService
                  .listenParticipantSceneChange(this.user.user_id)
                  .subscribe(async (message) => {
                    console.log(
                      "message from socket server okkkk ====>",
                      message
                    );
                    switch (message.data.action) {
                      case EventScreenActionEnum.ON_SCREEN_VIDEO:
                        // check if attendee was already on side call then leave from side call
                        if (this.isSidePanelRoom) {
                          this.sidecallService.endSideCall();
                        }
                        // TODO join paticipant with video stream
                        this.agoraRTCStreamHandler.setHoldStateData(
                          false,
                          false
                        );
                        console.log("ready to join with video");
                        await this.agoraRTCStreamHandler.switchAudioToVideo();
                        this.broadcastLiveEventState("join", "video");
                        this.setOnAir(true);
                        break;

                      case EventScreenActionEnum.ON_SCREEN_AUDIO:
                        // check if attendee was already on side call then leave from side call
                        if (this.isSidePanelRoom) {
                          this.sidecallService.endSideCall();
                        }
                        // TODO join paticipant with audio stream
                        this.agoraRTCStreamHandler.setHoldStateData(
                          false,
                          false
                        );
                        console.log("ready to join with audio");
                        await this.agoraRTCStreamHandler.switchVideoToAudio();
                        await this.agoraRTCStreamHandler.closeCameraMic(
                          "video"
                        );
                        this.setOnAir(true);
                        this.broadcastLiveEventState("join", "audio");
                        break;

                      case EventScreenActionEnum.LEFT_SCREEN:
                        // TODO remove participant from screen
                        if (this.handleLeftScreen) {
                          this.agoraRTCStreamHandler.setHoldStateData(
                            false,
                            false
                          );
                          this.handleLeftScreen = false;
                        } else {
                          this.agoraRTCStreamHandler.setHoldStateData(
                            false,
                            true
                          );
                        }
                        console.log("ready to left the scene");
                        await this.agoraRTCStreamHandler.leaveOnAir();
                        await this.agoraRTCStreamHandler.closeCameraMic();
                        this.setOnAir(false);
                        // this.broadcastLiveEventState("leave");
                        break;

                      case EventScreenActionEnum.ON_SCREEN_HOLD:
                        // TODO get Hold state
                        clearTimeout(this.holdStateTimeoutRef);
                        console.log("ready in hold state");
                        this.agoraRTCStreamHandler.setHoldStateData(true, true);
                        this.holdStateTimeoutRef = setTimeout(() => {
                          this.agoraRTCStreamHandler.setHoldStateData(
                            false,
                            true
                          );
                        }, 8000);
                        break;

                      case EventScreenActionEnum.OFF_SCREEN_HOLD:
                        // TODO get off Hold state
                        console.log("off hold state");
                        clearTimeout(this.holdStateTimeoutRef);
                        if (this.isOnAir) {
                          this.handleLeftScreen = true;
                        } else {
                          this.handleLeftScreen = false;
                        }
                        this.agoraRTCStreamHandler.setHoldStateData(
                          false,
                          false
                        );
                        this.setOnAir(false);
                        break;

                      default:
                        throw `action not found ${message.data.action}`;
                        break;
                    }
                  });

                this.eventSocketService
                  .listenOnSidechatCall()
                  .subscribe((message) => {
                    console.log(
                      "message from socket server okkkk ====>",
                      message
                    );
                    if (message?.sender_id && message.receiver_id) {
                      let index = this.participants.findIndex(
                        (x) => x.user.userId === message.sender_id
                      );
                      if (index >= 0) {
                        this.participants[index].sidechatCall =
                          message.sidechat_call;
                      }

                      index = this.participants.findIndex(
                        (x) => x.user.userId === message.receiver_id
                      );
                      if (index >= 0) {
                        this.participants[index].sidechatCall =
                          message.sidechat_call;
                      }
                      this.dataShareService.changedOnSideChatCall(message);
                      this.brickStructure(this.participants);
                    }
                  });

                this.eventSocketService
                  .listenOffSidechatCall()
                  .subscribe((message) => {
                    console.log(
                      "message from socket server okkkk ====>",
                      message
                    );
                    if (message?.sidechat_call) {
                      const call_participents = message.users;
                      call_participents.forEach((participant_id) => {
                        let index = this.participants.findIndex(
                          (x) => x.user.userId === participant_id
                        );
                        if (index >= 0) {
                          this.participants[index].sidechatCall = null;
                        }
                      });
                      if (call_participents.includes(this.user.user_id)) {
                        this.sideCallRoom = null;
                        this.isSidePanelRoom = false;
                        // if (message?.sidechat_call?.endTime) {
                        //   this.sideCallRoom = null;
                        //   this.isSidePanelRoom = false;
                        // } else this.sideCallRoom = message.sidechat_call;
                      }
                      this.dataShareService.changedOffSideChatCall(message);
                      this.brickStructure(this.participants);
                    }
                  });

                //get sidechat lock trigger from socket
                this.eventSocketService
                  .listenLockSidechatCall()
                  .subscribe((message) => {
                    console.log("message from socket server ====>", message);
                    if (message) {
                      const call_participents = message.call_participents;
                      call_participents.forEach((participant_id) => {
                        let index = this.participants.findIndex(
                          (x) => x.user.userId === participant_id
                        );
                        if (index >= 0) {
                          this.participants[index].sidechatCall =
                            message.sidechat_call;
                        }
                      });
                      if (call_participents.includes(this.user.user_id)) {
                        this.sideCallRoom = message.sidechat_call;
                      }
                      this.dataShareService.changedLockSideChatRoom(message);
                      this.brickStructure(this.participants);
                    }
                  });

                this.agoraRTCStreamHandler.activeEventId = this.event.eventId;
                // Join agora session at receiver/audience
                this.startAgoraHandling();
              } else {
                this.router.navigate(["not-found"]);
              }
            } else {
              this.serverError = response.message;
              this.toastr.error(this.serverError, "Error");
              this.router.navigate(["not-found"]);
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
              this.router.navigate(["not-found"]);
            }
          }
        );
    }
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
    let index = this.participants.findIndex(x => x.user.userId === this.selectedAttendeeProfileId);

    if (x == 1) {
      if (index == 0) {
        index = (this.participants.length - 1);
      } else {
        --index;
      }
    } else if (x == 2) {
      if ((index >= (this.participants.length - 1))) {
        index = 0;
      } else {
        ++index;
      }
    }

    const participant = this.participants[index];

    this.selectedAttendeeProfileId = participant.user.userId;
  }

  leaveEvent() {
    this.serverError = null;
    if (this.event && this.event.eventStatus == EventStatusEnum.STARTED) {
      this.loading = true;

      let value = {
        event_id: this.event.eventId,
      };

      this.eventService.leaveEvent(value).subscribe(
        async (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, "Success");
            // end agora session first
            await this.agoraRTCStreamHandler.leaveRoomChannel();
            if (this.modalRef && this.modalRef != undefined) {
              this.modalRef.close();
            }
            this.event.eventStatus = EventStatusEnum.ENDED;

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

  openModel(content, class_name = "") {
    this.modalRef = this.modalService.open(content, {
      windowClass: class_name,
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-07
   * @Description: serach user from event join list user
   **/
  onSearchChange(searchValue: string = "") {
    let filterRes = this.participants;
    this.searchString = searchValue;

    if (searchValue != "" || this.isSidechat || this.isBookmark) {
      filterRes = this.participants.filter((participant) => {
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

    this.fake_array = Array.from(Array(93), (x, index) => index + 1);
    for (let i = 0; i < filterRes.length; i++) {
      this.fake_array.pop();
    }
    this.brickStructure(filterRes);
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
   * @CreatedDate: 2021-06-22
   * @Description: modify array and create new participent array
   **/
  brickStructure(list_array = []) {
    let cart_list = [];

    if (
      this.view_state == this.views.CHAT_ONLY ||
      this.view_state == this.views.NONE
    ) {
      let user_card = [];
      let fake_card = [];

      let fakeCount = 0;
      let rowNo = 1;
      let firstRow = 6;
      let secondRow = 7;

      if (this.view_state == this.views.NONE) {
        firstRow = 10;
        secondRow = 11;
      }
      let counter = firstRow;

      //loop participents user and create new array
      list_array.forEach((element, i) => {
        // check if participant is onAir in live scene then make it un available for sidechat call
        if (
          this.agoraRTCStreamHandler.checkParticipantOnAir(
            element?.user?.userId
          )
        ) {
          element.isOnAir = true;
        } else {
          element.isOnAir = false;
        }
        user_card.push(element);
        counter--;

        //if counter 0 than insert row in array and start new row
        if (counter == 0) {
          cart_list.push({ row: rowNo, users: user_card, fakes: fake_card });
          counter = rowNo == 1 ? secondRow : firstRow;
          rowNo = rowNo == 1 ? 2 : 1;
          user_card = [];
          fake_card = [];
        }

        //create fake card for remain row and add in fake array
        if (this.all_participants.length == i + 1 && counter != 0) {
          for (let i = 0; i < counter; i++) {
            fake_card.push(i);
            fakeCount++;
          }

          cart_list.push({ row: rowNo, users: user_card, fakes: fake_card });
          counter = rowNo == 1 ? secondRow : firstRow;
          rowNo = rowNo == 1 ? 2 : 1;
          fake_card = [];
          user_card = [];
        }
      });

      let fakeExtra = Math.abs(this.fake_array.length - fakeCount);

      //create remaining card as fake
      for (let i = 0; i < fakeExtra; i++) {
        fake_card.push(i);
        counter--;

        if (counter == 0) {
          cart_list.push({ row: rowNo, users: user_card, fakes: fake_card });
          counter = rowNo == 1 ? secondRow : firstRow;
          rowNo = rowNo == 1 ? 2 : 1;
          fake_card = [];
          user_card = [];
        }
      }
    } else if (
      this.view_state == this.views.MEDIA_ONLY ||
      this.view_state == this.views.ALL
    ) {
      cart_list = list_array;
    }

    this.all_participants = cart_list;
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

  async startAgoraHandling() {
    await this.agoraRTCStreamHandler.initializeAgoraClient("audience");
    // join channel
    this.user.activeChannelId = this.event.eventId;
    await this.agoraRTCStreamHandler.joinRoomChannel();
    // check if user is onAir already then startScene
    if (this.isOnAir && this.isRaisedHand) {
      // check the mode in which the user was last time.
      const liveMode =
        (this.agoraRTCStreamHandler.activeEventState.data?.attendeeAudioMode &&
          "audio") ||
        "";
      await this.agoraRTCStreamHandler.startScene(liveMode, true);
      this.broadcastLiveEventState("join", liveMode || "video");
    } else {
      // this.broadcastLiveEventState("");
      // disable camera track if enabled
      // this.agoraRTCStreamHandler.toggleCamera(false);
    }

    // subscribe to event streaming content change event
    this.eventSocketService
      .listenCurrentStreamingContentChanged()
      .subscribe((data: BroadcastStreamingContent) => {
        // check if a user has to remove from onAir
        // if (data?.data?.removeRemoteUserID) {
        //   this.agoraRTCStreamHandler.removeRemoteUser({
        //     user: { uid: data.data.removeRemoteUserID },
        //   });
        // }
        // update live media status
        this.agoraRTCStreamHandler.setActiveEventState({
          event_id: this.event.eventId,
          data: { ...data.data },
        });
        // set the volume set by moderator
        // this.agoraRTCStreamHandler.setLocalStreamVolume();
        // this.handleLiveEventStateChange(data);
      });
  }

  broadcastLiveEventState(eventAction: string, joinMode = null) {
    const currentContentType =
      this.agoraRTCStreamHandler.activeEventState?.data?.contentType || "";
    const broadcastData: any = {
      contentType: currentContentType,
    };

    // check if active live media is agora or agorascreen media then do not broadcast
    if (eventAction === "join" && joinMode === "video") {
      // broadcastData.contentType = "agora";
      // broadcastData.attendeeVideoMode = true;
      //  broadcastData.attendeeAudioMode = false;
    } else if (eventAction === "join" && joinMode === "audio") {
      // broadcastData.contentType = "agora";
      //  broadcastData.attendeeVideoMode = false;
      // broadcastData.attendeeAudioMode = true;
    } else if (
      eventAction === "leave" &&
      !this.agoraRTCStreamHandler.mediaDataForView.length
    ) {
      broadcastData.contentType = "";
      this.agoraRTCStreamHandler.toggleCamera(false);
    }
    // update existing event state
    this.agoraRTCStreamHandler.setActiveEventState({
      event_id: this.event.eventId,
      data: broadcastData,
    });
    // this.eventSocketService
    //   .broadcastLiveEventState({
    //     event_id: this.event.eventId,
    //     data: broadcastData, //this.agoraRTCStreamHandler.activeEventState.data,
    //   })
    //   .subscribe(() => {});
  }

  // handleLiveEventStateChange(data: BroadcastStreamingContent) {
  //   if (data.event_id === this.event.eventId) {
  //     this.media = data?.data.media;
  //     this.content_type_middle = data?.data.contentType;
  //   }
  // }

  setOnAir(value) {
    this.isOnAir = value;
  }
}
