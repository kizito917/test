import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  EventEmitter,
  Output,
} from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import {
  NgbModalRef,
  NgbModal,
  NgbNavChangeEvent,
} from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { Subscription } from "rxjs";
import {
  MessengerInterface,
  EventService,
  EventSocketService,
  fieldIsRequired,
  MessengerSocketService,
  MessengerService,
  MakeMessageSeenInterface,
  UserService,
  getUserFromLocalStorage,
  setUserIntoLocalStorage,
  UserInterface,
  onlyTextAndSpace,
  AgoraRtcSidecallHandlerService,
  AgoraRtcStreamHandlerService,
} from "src/app/shared";
import { EventStatusEnum } from "src/app/shared/enums/event-status.enum";
import { DataShareService } from "src/app/shared/services/data-share-services/data-share.service";
import { ProfileDetaiModalComponent } from "src/app/shared/components/profile-detail-modal/profile-detail-modal.component";

@Component({
  selector: "app-side-chat",
  templateUrl: "./side-chat.component.html",
  styleUrls: ["./side-chat.component.scss"],
})
export class SideChatComponent implements OnInit, OnChanges, OnDestroy {
  @Input() event_id: string;
  @Input() event_status: number;
  @Input() user_id: string;
  @Input() participant_user_id: string;
  @Input() navigate_to_profile: number;
  @Input() is_moderator: boolean;
  @Input() is_allow_livechat: boolean = false;
  @Input() is_allow_sidechat_audio: boolean = false;
  @Input() is_allow_sidechat_video: boolean = false;
  @Input() view_state: number;
  @Input() sideCallRoom: any;
  @Input() isSidePanelRoom: boolean;

  @Output() messengerIndicator = new EventEmitter<number>();
  @Output() moveNextPreviousProfile = new EventEmitter<number>();

  ngb_tabs = {
    live_chat: 1,
    messenger: 2,
    calls: 3,
    profile: 4,
  };

  chosenRecipient: MessengerInterface = {
    user_id: "",
    display_name: "",
    full_name: "",
    profile_picture: "",
  };

  latest_message = {
    is_message_sent_or_received: false,
    messengerLogId: 0,
    message: "",
    createdDate: null,
    unseenCount: 0,
  };

  HTMLContainers = {
    conversation_container: "conversation_container",
    messengers_container: "messengers_container",
    livechat_container: "livechat_container",
  };

  recipient: MessengerInterface = {
    user_id: "",
    display_name: "",
    full_name: "",
    profile_picture: "",
  };

  blockMessageObj = {
    blockLable: "Block User",
    unblockLable: "Unblock User",
    blockMsg: "User blocked",
    userUnavailableMsg: "User unavailable",
    blockChatMsg: "You have blocked this user.",
    blockByChatMsg: "You have been blocked by this user.",
  };
  blockLable = this.blockMessageObj.blockLable;
  userAvailabilityMsg = this.blockMessageObj.userUnavailableMsg;
  chatBlockMsg = this.blockMessageObj.blockChatMsg;
  chatUserAvailabilityMsg = this.blockMessageObj.userUnavailableMsg;

  isBlock = false;
  loadingBlocked = false;
  isBlockMessanger = false;
  isMessengerOpen: boolean = false;
  isMessengerOpenAtTab: boolean = false;
  blocked_by = [];
  blocked = [];

  genericError = "service is not available. please try again later.";
  ngbActiveTab = 2;
  messenger_indicator = 0;
  livechat_indicator = 0;
  staticCount = 0;
  noOfUserJoined = 0;
  already_got_livechats = false;
  already_got_messengers = false;
  livechat_messages = [];
  serverError: any = null;
  recipient_id: any = null;
  conversation_loading = false;

  isEventJoined = false;
  isAvailableForSidechatMsg = false;
  isAvailableForSidechatProfile = false;
  loading = false;
  loadingDeactive = false;
  pageLoader = true;
  islisting = true;
  messengers = [];
  all_messengers = [];
  conversation = [];
  eventParticipants = [];
  detailOfJoinExistingCall = [];

  prev_tab = this.ngb_tabs.live_chat;

  today = new Date();
  user: UserInterface;

  participant: any;
  active_container_id: string;
  countries: any;

  callLoading: boolean = false;
  isIncomingCall: boolean = false;
  caller_loading: boolean = false;
  callerInfo: any = null;
  public room_interval: any;
  timer: number = 8;
  sideChatCall: any;
  callButtonLoader: boolean = false;
  isRoomLocked: boolean = false;
  declineCallByMessenger: boolean = false;

  sendMessageFG: FormGroup;
  castAvailableForSidechatSub: Subscription;
  castUserProfileImageSub: Subscription;
  castUserProfileDataSub: Subscription;
  castEventLiveChatSub: Subscription;
  castEventSideChatAudioSub: Subscription;
  castEventSideChatVideoSub: Subscription;
  castEventParticipantsSub: Subscription;
  castLockSideChatRoomSub: Subscription;
  castOnSideChatRoomSub: Subscription;
  castOffSideChatRoomSub: Subscription;

  public modalCalling: NgbModalRef;
  public callType: number;

  container: HTMLElement;
  castUpdateRemoteUserSubscription: Subscription;
  isSelectedProfileOnAir: boolean = false;
  isLoggedInUserOnAir: boolean = false;
  constructor(
    private eventService: EventService,
    private toastr: ToastrService,
    private eventSocketService: EventSocketService,
    private FB: FormBuilder,
    private messengerService: MessengerService,
    private messengerSocketService: MessengerSocketService,
    private modalService: NgbModal,
    private dataShareService: DataShareService,
    private sidecallService: AgoraRtcSidecallHandlerService,
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService
  ) {
    this.sendMessageFG = this.FB.group({
      message: ["", [fieldIsRequired("Message")]],
    });

    //get available for side subscribe
    this.castAvailableForSidechatSub =
      this.dataShareService.castAvailableForSidechat.subscribe((data) => {
        if (data) {
          if (this.chosenRecipient.user_id === data.user_id) {
            this.isAvailableForSidechatMsg = data.available_for_sidechat;
          }

          if (this.participant?.userId === data.user_id) {
            this.isAvailableForSidechatProfile = data.available_for_sidechat;
          }
        }
      });

    //get event live chat subscribe
    this.castEventLiveChatSub =
      this.dataShareService.castEventLiveChat.subscribe((data) => {
        if (data) {
          this.is_allow_livechat = data.allow_live_chat;
          this.ngbActiveTab =
            this.ngbActiveTab == this.ngb_tabs.live_chat
              ? this.ngb_tabs.messenger
              : this.ngbActiveTab;
        }
      });

    //get event side chat audio subscribe
    this.castEventSideChatAudioSub =
      this.dataShareService.castEventSideChatAudio.subscribe((data) => {
        if (data) {
          this.is_allow_sidechat_audio = data.allow_side_chat_audio;
        }
      });

    //get event side chat video subscribe
    this.castEventSideChatVideoSub =
      this.dataShareService.castEventSideChatVideo.subscribe((data) => {
        if (data) {
          this.is_allow_sidechat_video = data.allow_side_chat_video;
        }
      });

    //get profile image update subscribe
    this.castUserProfileImageSub =
      this.dataShareService.castUserProfileImage.subscribe((data) => {
        if (data) {
          if (this.chosenRecipient.user_id === data.user_id) {
            this.chosenRecipient.profile_picture = data.image_url;
          }

          if (this.participant?.userId === data.user_id) {
            this.participant.profilePicture = data.image_url;
          }

          //update img in msg user list
          let index = this.messengers.findIndex(
            (x) => x.receiver.userId === data.user_id
          );
          if (index >= 0) {
            this.messengers[index].receiver.profilePicture = data.image_url;
          }

          //update img in msg conversion
          this.conversation = this.conversation.map((x) => {
            if (x.sender.userId === data.user_id) {
              x.sender.profilePicture = data.image_url;
            }
            return x;
          });
        }
      });

    //get profile data update subscribe
    this.castUserProfileDataSub =
      this.dataShareService.castUserProfileData.subscribe((data) => {
        if (data) {
          if (this.chosenRecipient.user_id === data.user.userId) {
            this.chosenRecipient.display_name = data.user.displayName;
          }

          if (this.participant?.userId === data.user.userId) {
            this.participant.displayName = data.user.displayName;
            this.participant.city = data.user.city;
            this.participant.biography = data.user.biography;
            this.participant.country.name = data.user.country?.name;
            this.participant.tagLine = data.user.tagLine;
          }

          //update name in msg user list
          let index = this.messengers.findIndex(
            (x) => x.receiver.userId === data.user.userId
          );
          if (index >= 0) {
            this.messengers[index].receiver.displayName = data.user.displayName;
          }
        }
      });

    //get participents list change subscribe
    this.castEventParticipantsSub =
      this.dataShareService.castEventParticipants.subscribe((participents) => {
        if (participents?.userList) {
          this.eventParticipants = participents.userList;
          this.filterMessanger();
        }

        if (participents?.blockedList) {
          this.blocked = participents.blockedList.blocked;
          this.blocked_by = participents.blockedList.blocked_by;
        }
      });

    this.castLockSideChatRoomSub =
      this.dataShareService.castLockSideChatRoom.subscribe((data) => {
        if (data) {
          if (data.call_participents.includes(this.participant_user_id)) {
            this.sideChatCall = data.sidechat_call;
          }
          this.isRoomLocked = data.sidechat_call?.isLocked;
        }
      });

    this.castOnSideChatRoomSub =
      this.dataShareService.castOnSideChatRoom.subscribe((data) => {
        if (data) {
          this.callLoading = false;
          this.countNumberOfUsersInCall(data.sidechat_call);
          if (
            data.receiver_id == this.participant_user_id ||
            data.sender_id == this.participant_user_id
          ) {
            this.sideChatCall = data.sidechat_call;
          }
        }
      });

    this.castOffSideChatRoomSub =
      this.dataShareService.castOffSideChatRoom.subscribe((data) => {
        if (data) {
          if (data.users.includes(this.participant_user_id)) {
            this.sideChatCall = null; // data?.sidechat_call;
            this.noOfUserJoined = this.noOfUserJoined - 1;
            this.callLoading = false;
            // this.isRoomLocked = false;
          }
        }
      });

    this.agoraRTCStreamHandler.castFullScreenHandler.subscribe((data) => {
      if (data.isFullScreen) {
        if (!this.islisting && !this.isMessengerOpen) {
          this.back();
          this.isMessengerOpen = true;
        }
      } else if (!data.isFullScreen) {
        if (this.islisting && this.isMessengerOpen) {
          this.openMessageHistory(this.recipient_id);
          this.isMessengerOpen = false;
        }
      }
    });
  }

  ngOnInit() {
    if (!this.already_got_messengers) {
      this.messengerSocketService.connect().subscribe((x) => {
        console.log("messenger socket connected.");
      });

      this.messengerSocketService
        .joinRoom(this.user_id)
        .subscribe((message) => {
          console.log("messenger socket join.", message);
        });

      //call get messengers api
      this.getMessengersList();
    }

    // Subscribe to event where remote users are getting added or removed from live scene
    this.castUpdateRemoteUserSubscription =
      this.agoraRTCStreamHandler.castUpdateRemoteUser.subscribe((data) => {
        this.isSelectedProfileOnAir =
          !!this.agoraRTCStreamHandler.checkParticipantOnAir(
            this.participant?.userId
          );

        this.isLoggedInUserOnAir =
          !!this.agoraRTCStreamHandler.checkParticipantOnAir(this.user_id);
      });
  }

  // changes.prop contains the old and the new value...
  ngOnChanges(changes: SimpleChanges) {

    //console.log(changes?.sideCallRoom, "sidecall");
    if (changes?.sideCallRoom) {
      this.countInCallUser();
    }
    if (changes && changes.event_status && changes.event_status.currentValue) {
      if (this.event_id && this.event_status == EventStatusEnum.STARTED) {
        this.getEventLiveChats();
      }
    }

    if (
      changes &&
      changes.participant_user_id &&
      changes.participant_user_id.currentValue
    ) {
      //this.ngbActiveTab = this.ngb_tabs.profile;
      this.getAttendeeProfileDetails();
    } else if (
      changes &&
      changes.participant_user_id
    ) {
      if (!changes.participant_user_id.currentValue) {
        this.participant = null;
      }
      //this.participant = null;
    }

    if (
      changes &&
      changes.navigate_to_profile &&
      changes.navigate_to_profile.currentValue &&
      changes.navigate_to_profile.currentValue > 0 &&
      this.participant_user_id
    ) {
      this.ngbActiveTab = this.ngb_tabs.profile;
    }

    if (changes && changes.is_allow_livechat?.currentValue) {
      this.ngbActiveTab = this.is_allow_livechat
        ? this.ngb_tabs.live_chat
        : this.ngbActiveTab;
    }
    if (changes?.sideCallRoom && !changes.sideCallRoom?.currentValue)
      this.callLoading = false;
  }

  ngOnDestroy() {
    if (this.already_got_livechats) {
      this.eventSocketService.leaveRoom(this.event_id);
    }
    this.clearCallWaitingTimer();
  }

  clearCallWaitingTimer() {
    if (this.room_interval) {
      clearInterval(this.room_interval);
      this.room_interval = null;
      this.timer = 8;
    }
  }

  onNavChange(changeEvent: NgbNavChangeEvent) {
    if (!this.islisting && changeEvent.nextId !== this.ngb_tabs.messenger) {
      this.back();
      this.isMessengerOpenAtTab = true;
    }
    if (
      this.isMessengerOpenAtTab &&
      changeEvent.nextId === this.ngb_tabs.messenger
    ) {
      this.openMessageHistory(this.recipient_id);
      this.isMessengerOpenAtTab = false;
    }
    if (
      changeEvent.nextId === this.ngb_tabs.live_chat &&
      this.already_got_livechats
    ) {
      this.scrollToBottom(this.HTMLContainers.livechat_container, 300);
      this.livechat_indicator = 0;
    } else if (
      changeEvent.nextId === this.ngb_tabs.messenger &&
      this.chosenRecipient.user_id
    ) {
      this.messenger_indicator = this.messenger_indicator - this.staticCount;
      this.messengerIndicator.emit(this.messenger_indicator);
      this.staticCount = 0;
      this.scrollToBottom(this.HTMLContainers.conversation_container, 300);
    }
  }

  getEventLiveChats() {
    if (
      !this.already_got_livechats &&
      this.event_id &&
      this.event_status == EventStatusEnum.STARTED
    ) {
      this.eventSocketService.connect().subscribe((x) => {
        // console.log('event socket connected.', x);
      });

      this.conversation_loading = true;

      this.eventService.getEventLiveChat(this.event_id).subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.already_got_livechats = true;
            this.conversation_loading = false;

            this.livechat_messages = response.data.livechats;
            this.scrollToBottom(this.HTMLContainers.livechat_container, 1000);

            if (this.ngbActiveTab != this.ngb_tabs.live_chat) {
              this.livechat_indicator = this.livechat_messages.length;
            }

            this.eventSocketService
              .joinRoom(this.event_id)
              .subscribe((message) => {
                console.log("event socket join.", message);
              });

            this.eventSocketService
              .joinRoom(this.user_id)
              .subscribe((message) => {
                console.log("user socket join.", message);
              });

            this.eventSocketService
              .listenReceiveLiveChatMessage()
              .subscribe((message) => {
                console.log("message from socket server ====>", message);
                if (
                  message &&
                  message.event_id &&
                  message.event_id == this.event_id &&
                  message.livechat
                ) {
                  this.livechat_messages.push(message.livechat);
                  this.scrollToBottom(
                    this.HTMLContainers.livechat_container,
                    500
                  );

                  if (this.ngbActiveTab != this.ngb_tabs.live_chat) {
                    this.livechat_indicator = this.livechat_indicator + 1;
                  }
                }
              });

            this.eventSocketService
              .listenBlockUnblockUser()
              .subscribe((message) => {
                if (message?.user_id && message.user_id == this.user_id) {
                  if (message.block == true) {
                    this.blocked_by.push(message.block_by);
                  } else {
                    this.blocked_by = this.blocked_by.filter(
                      (id) => id !== message.block_by
                    );
                  }

                  if (this.participant?.userId == message.block_by) {
                    this.isBlock = message.block;
                    this.userAvailabilityMsg =
                      message.block == true
                        ? this.blockMessageObj.blockMsg
                        : this.blockMessageObj.userUnavailableMsg;

                    if (this.blocked.includes(message.block_by)) {
                      this.isBlock = true;
                      this.userAvailabilityMsg = this.blockMessageObj.blockMsg;
                      this.blockLable = this.blockMessageObj.unblockLable;
                    }
                  }

                  if (this.chosenRecipient?.user_id == message.block_by) {
                    this.isBlockMessanger = message.block;
                    this.chatBlockMsg = this.blockMessageObj.blockByChatMsg;
                    this.chatUserAvailabilityMsg =
                      message.block == true
                        ? this.blockMessageObj.blockMsg
                        : this.blockMessageObj.userUnavailableMsg;

                    if (this.blocked.includes(message.block_by)) {
                      this.isBlockMessanger = true;
                      this.chatBlockMsg = this.blockMessageObj.blockChatMsg;
                      this.chatUserAvailabilityMsg =
                        this.blockMessageObj.blockMsg;
                    }
                  }
                }
              });

            this.eventSocketService
              .listenSideCallInvitation()
              .subscribe((message) => {
                console.log("message from socket server ====>", message);
                if (message && message.receiver_id == this.user_id) {
                  // if same call room invitation come then ignore it
                  this.callType = message.sidechat_call?.callType;
                  if (
                    this.isIncomingCall &&
                    this.sideCallRoom?.sidechatCallId ===
                      message.sidechat_call?.sidechatCallId
                  )
                    return;
                  if (this.isIncomingCall) {
                    // check if I am already waiting for already requested side call inviation to finish
                    this.autoDeclineSideCallInviation(
                      message.sidechat_call?.sidechatCallId
                    );
                    return;
                  }

                  this.sideCallRoom = message.sidechat_call;
                  this.isIncomingCall = true;
                  this.prev_tab = this.ngbActiveTab;
                  this.ngbActiveTab = this.ngb_tabs.calls;
                  const sender_id = message.sender_id;
                  this.caller_loading = true;
                  console.log("coming to side call");
                  this.startInterval();
                  this.eventService
                    .getAttendeeProfile(sender_id, this.event_id)
                    .subscribe(
                      (response: any) => {
                        console.log(response);
                        if (response && response.is_success) {
                          this.caller_loading = false;
                          this.callerInfo = response.data.participant;
                        } else {
                          this.caller_loading = false;
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
                        this.caller_loading = false;
                      }
                    );
                }
              });

            this.eventSocketService
              .listenSideCallCancel()
              .subscribe((message) => {
                console.log("message from socket server ====>", message);
                if (message && message.receiver_id == this.user_id) {
                  this.sideCallRoom = null;
                  this.isIncomingCall = false;
                  this.callerInfo = null;
                  if (this.room_interval) {
                    this.clearCallWaitingTimer();
                    this.timer = 8;
                  }
                  this.ngbActiveTab = this.prev_tab;
                }
              });
          } else {
            this.conversation_loading = false;
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
        },
        (err: HttpErrorResponse) => {
          this.conversation_loading = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
    }
  }

  resetSendMessageFormGroup() {
    //this.controlContainerSubmissionService.submitted.next(false);
    this.sendMessageFG.reset();
  }

  sendLiveChatMessage() {
    this.serverError = null;

    if (this.sendMessageFG.valid) {
      this.loading = true;
      let value = {
        ...this.sendMessageFG.value,
        event_id: this.event_id,
      };

      this.eventService.sendLiveChatMessage(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');
            //this.messages.push(response.data.livechat);

            this.resetSendMessageFormGroup();
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

  getMessengersList() {
    if (!this.already_got_messengers) {
      this.conversation_loading = true;

      this.messengerService.getMessengers().subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.already_got_messengers = true;

            this.messengers = response.data.messengers;
            this.all_messengers = this.messengers;
            this.conversation_loading = false;
            this.filterMessanger();

            this.messengerSocketService
              .listenToReceiveNewMessenger()
              .subscribe((message) => {
                console.log("listenToReceiveNewMessenger ====>", message);
                if (
                  message &&
                  message.messenger &&
                  message.user_id === this.user_id
                ) {
                  this.messengers.splice(0, 0, message.messenger);
                  this.all_messengers = this.messengers;

                  if (
                    message.messenger &&
                    message.messenger.unseenCount &&
                    parseInt(message.messenger.unseenCount) > 0
                  ) {
                    this.messenger_indicator =
                      this.messenger_indicator +
                      parseInt(message.messenger.unseenCount);
                    this.messengerIndicator.emit(this.messenger_indicator);
                  }
                }
              });

            this.messengerSocketService
              .listenToReceiveMessage()
              .subscribe((message) => {
                console.log("message from socket server ====>", message);
                if (
                  message &&
                  message.new_message &&
                  message.new_message.receiver.userId == this.user_id
                ) {
                  if (
                    !this.islisting &&
                    this.chosenRecipient.user_id ===
                      message.new_message.sender.userId
                  ) {
                    this.conversation.push(message.new_message);
                    this.scrollToBottom(
                      this.HTMLContainers.conversation_container,
                      300
                    );

                    this.latest_message.is_message_sent_or_received = true;
                    this.latest_message.messengerLogId =
                      message.new_message.messengerLogId;
                    this.latest_message.message = message.new_message.message;
                    this.latest_message.createdDate =
                      message.new_message.createdDate;

                    if (
                      this.ngbActiveTab !== this.ngb_tabs.messenger ||
                      this.view_state == 1 ||
                      this.view_state == 3
                    ) {
                      this.staticCount = this.staticCount + 1;
                      this.messenger_indicator = this.messenger_indicator + 1;
                      this.messengerIndicator.emit(this.messenger_indicator);
                    }
                  } else {
                    if (
                      this.chosenRecipient.user_id ===
                      message.new_message.sender.userId
                    ) {
                      this.conversation.push(message.new_message);
                    }

                    //check reciver exist into messengers list
                    //if yes then update latest message & count of unseen messages

                    let index = this.messengers.findIndex(
                      (item) =>
                        item.receiver.userId ===
                        message.new_message.sender.userId
                    );

                    if (index > -1) {
                      let _messenger = this.messengers.find(
                        (item) =>
                          item.receiver.userId ===
                          message.new_message.sender.userId
                      );

                      this.messengers.splice(index, 1);

                      if (_messenger && _messenger != undefined) {
                        _messenger.latestMessage.messengerLogId =
                          message.new_message.messengerLogId;
                        _messenger.latestMessage.message =
                          message.new_message.message;
                        _messenger.latestMessage.createdDate =
                          message.new_message.createdDate;

                        _messenger.unseenCount =
                          parseInt(_messenger.unseenCount) + 1;

                        this.messengers.splice(0, 0, _messenger);

                        this.messenger_indicator = this.messenger_indicator + 1;
                        this.messengerIndicator.emit(this.messenger_indicator);
                      }
                    }
                  }
                }
              });

            for (let messenger of this.messengers) {
              if (
                messenger &&
                messenger.unseenCount &&
                parseInt(messenger.unseenCount) > 0
              ) {
                this.messenger_indicator =
                  this.messenger_indicator + parseInt(messenger.unseenCount);
                this.messengerIndicator.emit(this.messenger_indicator);
              }
            }

            //if (this.message_indicator > 0) {
            //  this.messageIndicator.emit(this.message_indicator);
            //}
          } else {
            this.conversation_loading = false;
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
        },
        (err: HttpErrorResponse) => {
          this.conversation_loading = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
    }
  }

  openMessageHistory(recipient_id) {
    this.islisting = false;
    this.recipient_id = recipient_id;
    this.latest_message.is_message_sent_or_received = false;
    if (
      !this.chosenRecipient.user_id ||
      (this.chosenRecipient.user_id &&
        this.chosenRecipient.user_id !== recipient_id)
    ) {
      this.chosenRecipient.user_id = recipient_id;

      //call get conversation api
      this.getMessengerConversations();
    } else {
      this.scrollToBottom(this.HTMLContainers.conversation_container, 300);
    }

    if (this.user_id && this.chosenRecipient.user_id) {
      // make all unseen messages seen
      const makeMessageSeen: MakeMessageSeenInterface = {
        sender_id: this.user_id,
        receiver_id: this.chosenRecipient.user_id,
      };

      this.messengerSocketService.makeMessagesSeen(makeMessageSeen);

      // update messanger unseen count
      let index = this.messengers.findIndex(
        (item) => item.receiver.userId === this.chosenRecipient.user_id
      );

      if (index > -1) {
        let _messenger = this.messengers.find(
          (item) => item.receiver.userId === this.chosenRecipient.user_id
        );

        if (
          _messenger &&
          _messenger != undefined &&
          _messenger.unseenCount &&
          parseInt(_messenger.unseenCount) > 0
        ) {
          this.messenger_indicator =
            this.messenger_indicator - parseInt(_messenger.unseenCount);
          this.messengerIndicator.emit(this.messenger_indicator);

          _messenger.unseenCount = 0;
          this.messengers.splice(index, 1, _messenger);
        }
      }
    }
  }

  getMessengerConversations() {
    this.isBlockMessanger = false;
    this.conversation_loading = true;
    this.chatUserAvailabilityMsg = this.blockMessageObj.userUnavailableMsg;
    let eventId = this.event_id ? this.event_id : "0";

    this.messengerService
      .getMessengerConversation(this.chosenRecipient.user_id, eventId)
      .subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.conversation = response.data.conversation;

            if (
              this.conversation.length > 0 &&
              response.data.recipient.userId
            ) {
              this.chosenRecipient.display_name =
                response.data.recipient.displayName;
              this.chosenRecipient.full_name = response.data.recipient.fullName;
              this.chosenRecipient.profile_picture =
                response.data.recipient.profilePicture;
            } else {
              this.chosenRecipient.display_name = this.recipient.display_name;
              this.chosenRecipient.full_name = this.recipient.full_name;
              this.chosenRecipient.profile_picture =
                this.recipient.profile_picture;
            }

            this.conversation_loading = false;
            this.scrollToBottom(
              this.HTMLContainers.conversation_container,
              500
            );

            //check is avialbe for sidechat
            this.isAvailableForSidechatMsg = response.data.participant
              ?.isAvailableForSidechat
              ? true
              : false;

            //hide chat option for bloked user
            if (this.blocked_by.includes(this.chosenRecipient.user_id)) {
              this.isBlockMessanger = true;
              this.chatBlockMsg = this.blockMessageObj.blockByChatMsg;
              this.chatUserAvailabilityMsg = this.blockMessageObj.blockMsg;
            }
            if (this.blocked.includes(this.chosenRecipient.user_id)) {
              this.isBlockMessanger = true;
              this.chatBlockMsg = this.blockMessageObj.blockChatMsg;
              this.chatUserAvailabilityMsg = this.blockMessageObj.blockMsg;
            }
          } else {
            this.conversation_loading = false;
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
        },
        (err: HttpErrorResponse) => {
          this.conversation_loading = false;
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
        }
      );
  }

  back() {
    this.islisting = true;

    if (
      this.latest_message.is_message_sent_or_received &&
      this.latest_message.messengerLogId > 0 &&
      this.chosenRecipient.user_id
    ) {
      //find chosen recipient
      //update latestMessage & unseen count

      let index = this.messengers.findIndex(
        (item) => item.receiver.userId === this.chosenRecipient.user_id
      );

      if (index > -1) {
        let _messenger = this.messengers.find(
          (item) => item.receiver.userId === this.chosenRecipient.user_id
        );

        this.messengers.splice(index, 1);
        if (_messenger && _messenger != undefined) {
          _messenger.latestMessage.messengerLogId =
            this.latest_message.messengerLogId;
          _messenger.latestMessage.message = this.latest_message.message;
          _messenger.latestMessage.createdDate =
            this.latest_message.createdDate;

          _messenger.unseenCount = this.latest_message.unseenCount;

          this.messengers.splice(0, 0, _messenger);
        }
      }
      this.latest_message.is_message_sent_or_received = false;
    }
  }

  scrollToBottom(container_id, interval: number) {
    this.active_container_id = container_id;

    setTimeout(() => {
      this.container = document.getElementById(this.active_container_id);
      if (this.container) {
        this.container.scrollTop = this.container.scrollHeight;
      }
    }, interval);
  }

  sendMessage() {
    this.serverError = null;
    if (this.sendMessageFG.valid && this.chosenRecipient.user_id) {
      this.loading = true;

      let value = {
        ...this.sendMessageFG.value,
        receiver_id: this.chosenRecipient.user_id,
      };

      this.messengerService.sendMessage(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');

            this.conversation.push(response.data.message);
            this.scrollToBottom(
              this.HTMLContainers.conversation_container,
              300
            );

            this.latest_message.is_message_sent_or_received = true;
            this.latest_message.messengerLogId =
              response.data.message.messengerLogId;
            this.latest_message.message = response.data.message.message;
            this.latest_message.createdDate = response.data.message.createdDate;

            this.resetSendMessageFormGroup();
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

  getAttendeeProfileDetails() {
    
    if (this.participant_user_id) {
      this.sideChatCall = false;
      this.isBlock = false;
      this.userAvailabilityMsg = this.blockMessageObj.userUnavailableMsg;
      this.blockLable = this.blockMessageObj.blockLable;
      this.conversation_loading = true;
      let eventId = this.event_id ? this.event_id : "0";
      this.isRoomLocked = this.sideCallRoom ? this.isRoomLocked : false;
      this.eventService
        .getAttendeeProfile(this.participant_user_id, eventId)
        .subscribe(
          (response: any) => {
            if (response && response.is_success) {
              this.participant = response.data.participant;
              this.conversation_loading = false;
              this.isEventJoined = this.participant.eventParticipantId
                ? true
                : false;
              this.isAvailableForSidechatProfile = this.participant
                .isAvailableForSidechat
                ? true
                : false;
              this.sideChatCall = response.data?.sidechat_call?.sidechatCall;
              this.countNumberOfUsersInCall(this.sideChatCall);
              // check if selected user profile is already on air in live scene then do not show audio/video call button
              this.isSelectedProfileOnAir =
                !!this.agoraRTCStreamHandler.checkParticipantOnAir(
                  this.participant?.userId
                );
              // checking if the current user is onAir
              this.isLoggedInUserOnAir =
                !!this.agoraRTCStreamHandler.checkParticipantOnAir(
                  this.user_id
                );
              //disable icon for blocked user
              if (this.blocked_by.includes(this.participant_user_id)) {
                this.isBlock = true;
                this.userAvailabilityMsg = this.blockMessageObj.blockMsg;
                this.blockLable = this.blockMessageObj.blockLable;
              }
              if (this.blocked.includes(this.participant_user_id)) {
                this.isBlock = true;
                this.userAvailabilityMsg = this.blockMessageObj.blockMsg;
                this.blockLable = this.blockMessageObj.unblockLable;
              }
            } else {
              this.conversation_loading = false;
              this.serverError = response.message;
              this.toastr.error(this.serverError, "Error");
            }
          },
          (err: HttpErrorResponse) => {
            this.conversation_loading = false;
            this.serverError = this.genericError;
            if (err && err.error) {
              this.serverError = err.error.message;
            }
            this.toastr.error(this.serverError, "Error");
          }
        );
      this.countInCallUser();
    }
    //else {

    //}
  }

  // Start sidechat call
  callModal({ receiver, callType }) {
    clearTimeout();
    if (this.modalCalling) {
      this.modalCalling.close();
    }
    this.callLoading = true;

    // reset old receiver
    this.sidecallService.resetReceiver();
    if (
      !this.participant.isOnCall &&
      !this.sideCallRoom &&
      !this.sideChatCall
    ) {
      const callInfo = {
        event_id: this.event_id,
        sender_id: this.user_id,
        receiver_id: this.participant.userId,
        call_type: callType,
      };
      // send call invitation
      this.eventService.startSideChatCall(callInfo).subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.sideCallRoom = response.data?.sidechat_call;
            this.sidecallService.initiateSidecall(this.sideCallRoom, receiver);
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
          this.callLoading = false;
        }
      );
    } else {
      // join existing call
      const callInfo = {
        sender_id: this.user_id,
        receiver_id: this.participant.userId,
        sidechat_call_id:
          this.sideCallRoom?.sidechatCallId ||
          this.sideChatCall?.sidechatCallId,
      };
      // send call invitation
      this.eventService.joinSideChatCall(callInfo).subscribe(
        (response: any) => {
          if (response && response.is_success) {
            this.sidecallService.initiateSidecall(
              response.data?.sidechat_call,
              receiver
            );
            this.sideCallRoom = response.data?.sidechat_call;
            //this.toastr.success(response.message, "Success");
          } else {
            this.toastr.error(response.message, "Error");
          }
          setTimeout(() => {
            this.callLoading = false;
          }, 10000);
          //  this.callLoading = false;
        },
        (err: HttpErrorResponse) => {
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
          this.callLoading = false;
        }
      );
    }
  }

  navigateToMessenger() {
    this.recipient.display_name = this.participant.displayName;
    this.recipient.full_name = this.participant.fullName;
    this.recipient.profile_picture = this.participant.profilePicture;
    this.recipient.user_id = this.participant.userId;

    this.ngbActiveTab = this.ngb_tabs.messenger;

    //if (changes && changes.chosen_recipient && changes.chosen_recipient.currentValue && this.chosen_recipient.display_name) {
    //check chosen_recipient exist into messenger list
    //if yes then open that recipient chat history
    //if not then direct setup new recipient chat history
    this.openMessageHistory(this.recipient.user_id);
    //}

    //this.navigateTo.emit(this.ngb_tabs.messenger);
    //this.messageRecipient.emit(this.recipient);
  }

  navigateToProfile(participant_user_id) {
    this.participant_user_id = participant_user_id;
    this.ngbActiveTab = this.ngb_tabs.profile;
    this.getAttendeeProfileDetails();
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-09
   * @Description: use this function to open profile detail model
   **/
  openEditProfileModal() {
    const refModal = this.modalService.open(ProfileDetaiModalComponent, {
      backdrop: "static",
      keyboard: false,
      windowClass: "profile_change",
      centered: true,
    });
    refModal.componentInstance.eventId = this.event_id;
    refModal.componentInstance.profilePicture = this.participant.profilePicture;
    refModal.componentInstance.userId = this.user_id;
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-10
   * @Description: use this function to make user as bookmarked
   **/
  addBookmark() {
    this.loading = true;
    this.participant.bookmarkId = null;
    let value = {
      user_id: this.participant.userId,
    };

    this.eventService.bookmarkUser(value).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.participant.bookmarkId = response.data?.fanspaceUserBookmark?.id;
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

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-10
   * @Description: use this function to remove user as bookmarked
   **/
  removeBookmark() {
    this.loading = true;

    this.eventService.removeUserBookmark(this.participant.bookmarkId).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.participant.bookmarkId = null;
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

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-21
   * @Description: use this function to filter messanger user with event user
   **/
  filterMessanger() {
    this.messengers = this.all_messengers.filter((msgr) =>
      this.eventParticipants.includes(msgr.receiver.userId)
    );
    //this.messengers = this.all_messengers.filter(msgr => this.eventParticipants.some(({user}) => msgr.receiver.userId === user.userId));
  }

  startInterval() {
    if (this.room_interval) return;
    this.room_interval = setInterval(() => {
      this.timer -= 1;
      if (this.timer === -1) {
        this.clearCallWaitingTimer();
        this.ngbActiveTab = this.prev_tab;

        this.eventService
          .timeOutSideChatCall({
            sidechat_call_id: this.sideCallRoom?.sidechatCallId,
          })
          .subscribe(
            (response: any) => {
              if (response?.is_success) {
                //this.toastr.success(response.message, "Success");
                this.room_interval = null;
                this.timer = 8;
              } else {
                this.serverError = response.message;
                this.toastr.error(this.serverError, "Error");
              }
              this.isIncomingCall = false;
              this.sideCallRoom = null;
              this.callerInfo = null;
              this.caller_loading = false;
            },
            (err: HttpErrorResponse) => {
              this.serverError = this.genericError;
              if (err && err.error) {
                this.serverError = err.error.message;
              }
              this.toastr.error(this.serverError, "Error");
              this.caller_loading = false;
              this.isIncomingCall = false;
              this.sideCallRoom = null;
              this.callerInfo = null;
            }
          );
      }
    }, 1000);
  }

  acceptSideCallHandler() {
    // stop the time
    this.callButtonLoader = true;
    this.clearCallWaitingTimer();
    this.eventService
      .acceptSideChatCall({
        sidechat_call_id: this.sideCallRoom.sidechatCallId,
      })
      .subscribe(
        (response: any) => {
          if (response?.is_success) {
            this.isIncomingCall = false;
            this.sideCallRoom.callStatus = 1;
            this.sidecallService.initiateSidecall(this.sideCallRoom, null);
            if (this.room_interval) {
              this.clearCallWaitingTimer();
              this.timer = 8;
            }
            //this.toastr.success(response.message, "Success");
          } else {
            this.isIncomingCall = false;
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
          this.callButtonLoader = false;
          this.ngbActiveTab = this.prev_tab;
        },
        (err: HttpErrorResponse) => {
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
          this.caller_loading = false;
          this.isIncomingCall = false;
          this.callButtonLoader = false;
          this.ngbActiveTab = this.prev_tab;
        }
      );
  }

  autoDeclineSideCallInviation(sidechatCallId) {
    this.eventService
      .declineSideChatCall({
        sidechat_call_id: sidechatCallId,
      })
      .subscribe((response: any) => {});
  }

  declineSideCallHandler() {
    this.clearCallWaitingTimer();
    this.callButtonLoader = true;
    this.eventService
      .declineSideChatCall({
        sidechat_call_id: this.sideCallRoom.sidechatCallId,
      })
      .subscribe(
        (response: any) => {
          if (response?.is_success) {
            this.isIncomingCall = false;
            this.sideCallRoom = null;
            this.callerInfo = null;
            if (this.room_interval) {
              this.clearCallWaitingTimer();
              this.timer = 8;
            }
            //this.toastr.success(response.message, "Success");
          } else {
            this.isIncomingCall = false;
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
          }
          this.callButtonLoader = false;
          if (!this.declineCallByMessenger) {
            this.ngbActiveTab = this.prev_tab;
          } else {
            this.ngbActiveTab = this.ngb_tabs.messenger;
          }
          this.declineCallByMessenger = false;
        },
        (err: HttpErrorResponse) => {
          this.serverError = this.genericError;
          if (err && err.error) {
            this.serverError = err.error.message;
          }
          this.toastr.error(this.serverError, "Error");
          this.isIncomingCall = false;
          this.callButtonLoader = false;
          this.ngbActiveTab = this.prev_tab;
        }
      );
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-07-10
   * @Description: use this function to deactivate user from the event
   **/
  deactivateUser() {
    let value = {
      participant_id: this.participant.eventParticipantId,
    };
    this.loadingDeactive = true;

    this.eventService.deactivateUser(value).subscribe(
      (response: any) => {
        this.loadingDeactive = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");
          this.participant = null;
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.loadingDeactive = false;
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
   * @CreatedDate: 2021-07-15
   * @Description: use this function to block/unblock user
   **/
  blockUnblockUser() {
    let value = {
      user_id: this.participant.userId,
      block_user:
        this.isBlock && this.blockLable == this.blockMessageObj.blockLable
          ? true
          : !this.isBlock,
    };
    this.loadingBlocked = true;

    this.eventService.blockUnblockUser(value).subscribe(
      (response: any) => {
        this.loadingBlocked = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, "Success");

          this.isBlock = value.block_user;

          if (this.isBlock == true) {
            this.blocked.push(this.participant.userId);
            this.blockLable = this.blockMessageObj.unblockLable;
            this.userAvailabilityMsg = this.blockMessageObj.blockMsg;
          } else {
            this.blocked = this.blocked.filter(
              (id) => id !== this.participant.userId
            );
            this.blockLable = this.blockMessageObj.blockLable;
            this.userAvailabilityMsg = this.blockMessageObj.userUnavailableMsg;

            if (this.blocked_by.includes(this.participant.userId)) {
              this.isBlock = true;
              this.userAvailabilityMsg = this.blockMessageObj.blockMsg;
              this.chatBlockMsg = this.blockMessageObj.blockByChatMsg;
            }
          }
          if (this.chosenRecipient?.user_id == this.participant.userId) {
            this.isBlockMessanger = this.isBlock;
            this.chatBlockMsg = this.blockMessageObj.blockChatMsg;
            this.chatUserAvailabilityMsg =
              this.isBlock == true
                ? this.blockMessageObj.blockMsg
                : this.blockMessageObj.userUnavailableMsg;

            if (this.blocked_by.includes(this.participant.userId)) {
              this.isBlockMessanger = true;
              this.chatBlockMsg = this.blockMessageObj.blockByChatMsg;
              this.chatUserAvailabilityMsg = this.blockMessageObj.blockMsg;
            }
          }
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
      },
      (err: HttpErrorResponse) => {
        this.loadingBlocked = false;
        this.serverError = this.genericError;
        if (err && err.error) {
          this.serverError = err.error.message;
        }
        this.toastr.error(this.serverError, "Error");
      }
    );
  }
  showJoinCallPopup({ content, type }) {
    this.detailOfJoinExistingCall = this.getCallUser(this.sideChatCall);
    this.callType = type;
    return (this.modalCalling = this.modalService.open(content, {
      windowClass: "modal_call_join_window",
      centered: true,
      backdrop: "static",
      keyboard: false,
    }));
  }
  navigateToMessengerFromCall() {
    this.declineCallByMessenger = true;
    this.participant = this.callerInfo;
    this.navigateToMessenger();
  }
  countNumberOfUsersInCall(sideChatCall) {
    if (sideChatCall) {
      let userArray = this.getCallUser(sideChatCall);
      this.noOfUserJoined = userArray.length;
    }
  }
  countInCallUser() {
    this.noOfUserJoined = this.sidecallService.remoteStreams.length;
  }
  getCallUser(sideChatCall) {
    let currentsideChatCallId = sideChatCall?.sidechatCallId;
    return this.agoraRTCStreamHandler.eventParticipants.filter(
      (userDetails) =>
        (userDetails.sidechatCall?.sidechatCallId ||
          userDetails.sidechatCall) === currentsideChatCallId &&
        userDetails?.user?.userId !== this.participant?.userId
    );
  }

  navigateToNextPreviousProfile(x) {
    console.log(x);
    this.moveNextPreviousProfile.emit(x);
  }
}
