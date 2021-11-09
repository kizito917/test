import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { HttpErrorResponse } from "@angular/common/http";

import {
  AgoraRtcStreamHandlerService,
  EventService,
  EventSocketService,
} from "src/app/shared";
import { EventScreenActionEnum } from "src/app/shared/enums/event-screen-action";
import { LiveQandAState } from "src/app/shared/enums/live-qanda-state.enum";

@Component({
  selector: "app-live-qa",
  templateUrl: "./live-qa.component.html",
  styleUrls: ["./live-qa.component.scss"],
})
export class LiveQaComponent implements OnInit, OnChanges {
  @Input() eventParticipants: any;
  @Input() audioSceneTab: boolean;
  @Input() videoSceneTab: boolean;
  @Input() event: any;
  @Output() attendeeSelected = new EventEmitter<number>();

  public tabs = {
    random_users: 1,
    all_users: 2,
    active_users: 3,
    fav_users: 4,
  };

  public activeTab = 2;
  public randomCount = 5;
  public searchText = "";

  public users = [];
  public participants = [];
  public all_users = [];
  public selectedParticipants = [];

  public genericError = "service is not available. please try again later.";
  public serverError: any = null;

  public disabled: boolean = false;
  public favDisabled: boolean = false;
  public selectedParticipantLoader: string;

  constructor(
    private eventService: EventService,
    private eventSocketService: EventSocketService,
    private toastr: ToastrService,
    private agoraRTCStreamHandler: AgoraRtcStreamHandlerService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    console.log("changes live q&a =>>>>>>> ", changes);
    if (changes.eventParticipants && changes.eventParticipants.currentValue) {
      this.participants = this.excludeModeratorAndDownRaisedHand();
      this.selectedParticipants = this.participants.filter(
        (item) => item.liveQandAState !== LiveQandAState.ready
      );
      this.filterUsers();

      // if search value exist then search users
      this.onSearchChange(this.searchText);
    }

    if (changes.audioSceneTab) {
      this.toggleParticipantAudioScene();
    }
    if (changes.videoSceneTab) {
      this.toggleParticipantVideoScene();
    }
  }

  excludeModeratorAndDownRaisedHand() {
    return this.eventParticipants
      ? this.eventParticipants.filter((item) => {
          // check if someone is in selected list and their raisedHand is down then change their live qna status
          if (
            !item.raisedHand &&
            item.liveQandAState === LiveQandAState.onHold
          ) {
            this.removeAttendeeFromSceneQueue(item);
          }
          return !item.isModerator && item.raisedHand;
        })
      : [];
  }

  activateQATab(tab_state) {
    this.activeTab = tab_state;
    this.filterUsers();
  }

  filterUsers() {
    if (this.activeTab == this.tabs.random_users) {
      this.users = this.getRandomUsers();
    }
    if (this.activeTab == this.tabs.all_users) {
      this.users = this.participants;
    }
    if (this.activeTab == this.tabs.active_users) {
      this.users = this.selectedParticipants;
    }
    if (this.activeTab == this.tabs.fav_users) {
      this.users = this.participants.filter((item) => item.isFavourite == true);
    }
    this.all_users = this.users;
  }

  getRandomUsers() {
    let randUsers = [];
    if (this.participants.length < this.randomCount) return this.participants;
    for (let i = 0; i < this.randomCount; ) {
      let random = Math.floor(Math.random() * this.participants.length);
      if (randUsers.indexOf(this.participants[random]) !== -1) {
        continue;
      }
      randUsers.push(this.participants[random]);
      i++;
    }
    return randUsers;
  }

  toggleFavUser(participant_id) {
    this.favDisabled = true;
    console.log("toggle fav user ", participant_id);
    const itemIndex = this.participants.findIndex(
      (item) => item.eventParticipantId === participant_id
    );

    const payload = {
      participant_id,
      is_favorite: !this.participants[itemIndex].isFavourite,
    };

    this.eventService.toggleEventFavoriteParticipants(payload).subscribe(
      (response: any) => {
        if (response && response.is_success) {
          this.participants[itemIndex].isFavourite =
            !this.participants[itemIndex].isFavourite;
          this.filterUsers();
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, "Error");
        }
        this.favDisabled = false;
      },
      (err: HttpErrorResponse) => {
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError;
        }
        this.toastr.error(this.serverError, "Error");
        this.favDisabled = false;
      }
    );
  }

  async addAttendeeToSceneQueue(participant) {
    this.selectedParticipantLoader = participant.user.userId + "add";
    console.log("selected participants ", participant);

    this.disabled = true;

    if (this.selectedParticipants.length >= 7) {
      this.serverError = "you can not add more than 7 participants";
      this.disabled = false;
      return this.toastr.error(this.serverError, "Error");
    }

    let selectedIDs = [];
    let state = LiveQandAState.onHold;

    this.selectedParticipants.forEach((participant) => {
      selectedIDs.push(participant.eventParticipantId);
    });

    if (selectedIDs.includes(participant.eventParticipantId)) {
      this.serverError = "participant is already in queue";
      this.disabled = false;
      return this.toastr.error(this.serverError, "Error");
    }

    const itemIndex = this.participants.findIndex(
      (item) => item.eventParticipantId === participant.eventParticipantId
    );

    if (this.audioSceneTab || this.videoSceneTab) {
      state = LiveQandAState.onAir;
    } else {
      state = LiveQandAState.onHold;
    }

    let payload = {
      participant_id: participant.eventParticipantId,
      live_qanda_state: state,
    };

    try {
      if (this.audioSceneTab || this.videoSceneTab) {
        const action = this.videoSceneTab
          ? EventScreenActionEnum.ON_SCREEN_VIDEO
          : EventScreenActionEnum.ON_SCREEN_AUDIO;
        const data = {
          event_id: this.event.eventId,
          user_id: participant.user.userId,
          data: {
            action,
          },
        };
        await this.eventSocketService.sendParticipantSceneChange(data);
      }
      await this.updateLiveQAStatus(payload);

      this.participants[itemIndex].liveQandAState = state;
      this.selectedParticipants.push(participant);
      this.disabled = false;
      const data = {
        event_id: this.event.eventId,
        user_id: participant.user.userId,
        data: {
          action: EventScreenActionEnum.ON_SCREEN_HOLD,
        },
      };
      this.eventSocketService.sendParticipantSceneChange(data);
      this.selectedParticipantLoader = "";
    } catch (err) {
      this.disabled = false;
      console.warn(err);
      this.selectedParticipantLoader = "";
    }
  }

  async removeAttendeeFromSceneQueue(participant) {
    this.selectedParticipantLoader = participant.user.userId + "remove";
    console.log("selected removed participants ", participant);
    const data = {
      event_id: this.event.eventId,
      user_id: participant.user.userId,
      data: {
        action: EventScreenActionEnum.OFF_SCREEN_HOLD,
      },
    };
    this.eventSocketService.sendParticipantSceneChange(data);

    const itemIndex = this.eventParticipants.findIndex(
      (item) => item.eventParticipantId === participant.eventParticipantId
    );

    let payload = {
      participant_id: participant.eventParticipantId,
      live_qanda_state: LiveQandAState.ready,
    };

    try {
      if (this.audioSceneTab || this.videoSceneTab) {
        const action = EventScreenActionEnum.LEFT_SCREEN;
        const data = {
          event_id: this.event.eventId,
          user_id: participant.user.userId,
          data: {
            action,
          },
        };
        this.eventSocketService.sendParticipantSceneChange(data);
        // this.removeUserFromAgora(participant.user.userId);
      }
      await this.updateLiveQAStatus(payload);
      this.eventParticipants[itemIndex].liveQandAState = LiveQandAState.ready;
      this.selectedParticipants = this.selectedParticipants.filter(
        (item) => item.eventParticipantId != participant.eventParticipantId
      );
      this.filterUsers();
      this.selectedParticipantLoader = "";
    } catch (err) {
      console.warn(err);
      this.selectedParticipantLoader = "";
    }
  }

  async toggleParticipantVideoScene() {
    if (this.videoSceneTab) {
      const res = await Promise.all(
        (this.selectedParticipants = this.selectedParticipants.map(
          (participant) => {
            const data = {
              event_id: this.event.eventId,
              user_id: participant.user.userId,
              data: {
                action: EventScreenActionEnum.ON_SCREEN_VIDEO,
              },
            };
            this.eventSocketService.sendParticipantSceneChange(data);

            const itemIndex = this.participants.findIndex(
              (item) =>
                item.eventParticipantId === participant.eventParticipantId
            );

            const payload = {
              participant_id: participant.eventParticipantId,
              live_qanda_state: LiveQandAState.onAir,
            };
            this.updateLiveQAStatus(payload);
            this.participants[itemIndex].liveQandAState = LiveQandAState.onAir;
            participant.liveQandAState = LiveQandAState.onAir;
            return participant;
          }
        ))
      );
    } else {
      if (this.audioSceneTab) return;
      const res = await Promise.all(
        (this.selectedParticipants = this.selectedParticipants.map(
          (participant) => {
            const data = {
              event_id: this.event.eventId,
              user_id: participant.user.userId,
              data: {
                action: EventScreenActionEnum.LEFT_SCREEN,
              },
            };

            this.eventSocketService.sendParticipantSceneChange(data);
            // this.removeUserFromAgora(participant.user.userId);
            const itemIndex = this.participants.findIndex(
              (item) =>
                item.eventParticipantId === participant.eventParticipantId
            );

            const payload = {
              participant_id: participant.eventParticipantId,
              live_qanda_state: LiveQandAState.onHold,
            };
            this.updateLiveQAStatus(payload);
            this.participants[itemIndex].liveQandAState = LiveQandAState.onHold;
            participant.liveQandAState = LiveQandAState.onHold;
            return participant;
          }
        ))
      );
    }
  }

  async toggleParticipantAudioScene() {
    if (this.audioSceneTab) {
      const res = await Promise.all(
        (this.selectedParticipants = this.selectedParticipants.map(
          (participant) => {
            const data = {
              event_id: this.event.eventId,
              user_id: participant.user.userId,
              data: {
                action: EventScreenActionEnum.ON_SCREEN_AUDIO,
              },
            };

            this.eventSocketService.sendParticipantSceneChange(data);

            const itemIndex = this.participants.findIndex(
              (item) =>
                item.eventParticipantId === participant.eventParticipantId
            );

            const payload = {
              participant_id: participant.eventParticipantId,
              live_qanda_state: LiveQandAState.onAir,
            };
            this.updateLiveQAStatus(payload);
            this.participants[itemIndex].liveQandAState = LiveQandAState.onAir;
            participant.liveQandAState = LiveQandAState.onAir;
            return participant;
          }
        ))
      );
    } else {
      if (this.videoSceneTab) return;
      const res = await Promise.all(
        (this.selectedParticipants = this.selectedParticipants.map(
          (participant) => {
            const data = {
              event_id: this.event.eventId,
              user_id: participant.user.userId,
              data: {
                action: EventScreenActionEnum.LEFT_SCREEN,
              },
            };

            this.eventSocketService.sendParticipantSceneChange(data);
            //this.removeUserFromAgora(participant.user.userId);
            const itemIndex = this.participants.findIndex(
              (item) =>
                item.eventParticipantId === participant.eventParticipantId
            );

            const payload = {
              participant_id: participant.eventParticipantId,
              live_qanda_state: LiveQandAState.onHold,
            };
            this.updateLiveQAStatus(payload);
            this.participants[itemIndex].liveQandAState = LiveQandAState.onHold;
            participant.liveQandAState = LiveQandAState.onHold;
            return participant;
          }
        ))
      );
    }
  }

  updateLiveQAStatus(payload) {
    return new Promise((resolve, reject) => {
      this.eventService.changeParticipantLiveQAStatus(payload).subscribe(
        (response: any) => {
          if (response && response.is_success) {
            resolve(true);
          } else {
            this.serverError = response.message;
            this.toastr.error(this.serverError, "Error");
            reject(response.message);
          }
        },
        (err: HttpErrorResponse) => {
          if (err && err.error) {
            this.serverError = err.error.message;
          } else {
            this.serverError = this.genericError;
          }
          this.toastr.error(this.serverError, "Error");
          reject(err);
        }
      );
    });
  }

  // This method is of no use right now
  removeUserFromAgora(user_id) {
    // first remove user from moderator end
    // this.agoraRTCStreamHandler.removeRemoteUser({ user: { uid: user_id } });

    // remove that user from other attendee's end. For that broadcast activeEventState event
    this.eventSocketService
      .broadcastLiveEventState({
        event_id: this.event.eventId,
        data: {
          ...this.agoraRTCStreamHandler.activeEventState.data,
          removeRemoteUserID: user_id,
        },
      })
      .subscribe(() => {});
  }

  showUserProfile(userId) {
    this.attendeeSelected.emit(userId);
  }
  onSearchChange(searchValue: string = "") {
    let filterRes = this.all_users;
    this.searchText = searchValue;
    if (searchValue !== "") {
      filterRes = this.all_users.filter((participant) => {
        return (
          participant.user.displayName
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          participant.user.fullName
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          participant.user.city
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        );
      });
    }
    this.users = filterRes;
  }
}
