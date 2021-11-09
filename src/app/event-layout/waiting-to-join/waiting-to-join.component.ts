import { Component, OnInit, OnDestroy, HostBinding } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { FormGroup, FormBuilder } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { Subscription } from "rxjs";
import {
  getUserFromLocalStorage,
  UserInterface,
  fieldIsRequired,
  emailValidator,
  setUserIntoLocalStorage,
  EventSocketService,
  EventService,
  AgoraRtcStreamHandlerService,
} from "src/app/shared";
import { ControlContainerSubmissionService } from "src/app/shared/components/control-container/control-container-submission.service";
import { EventStatusEnum } from "src/app/shared/enums/event-status.enum";
import { ProfileImgModalComponent } from "src/app/shared/components/profile-img-modal/profile-img-modal.component";
import { DataShareService } from "src/app/shared/services/data-share-services/data-share.service";
import { ProfileDetaiModalComponent } from "src/app/shared/components/profile-detail-modal/profile-detail-modal.component";

@Component({
  selector: "app-waiting-to-join",
  templateUrl: "./waiting-to-join.component.html",
  styleUrls: ["./waiting-to-join.component.scss"],
})
export class WaitingToJoinComponent implements OnInit, OnDestroy {
  boxes = {
    waiting_box: 1,
    join_event_step1_box: 2,
    join_event_step2_box: 3,
    event_ended_box: 4
  };

  genericError = "service is not available. please try again later.";
  activeBox = this.boxes.waiting_box;
  serverError: any = null;
  socketJoined = false;
  loading = false;
  page_loader = true;
  isReadMore = true;
  profileError = "";
  event_code;
  event;
  fanspace;

  htmlEl;

  profilePicture: string;
  updateTaglineTooltip: boolean = false;
  otherParticipantTooltip: boolean = false;

  user: UserInterface;
  joinEventFG: FormGroup;
  castUserSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private FB: FormBuilder,
    private eventService: EventService,
    private toastr: ToastrService,
    private controlContainerSubmissionService: ControlContainerSubmissionService,
    private eventSocketService: EventSocketService,
    private modalService: NgbModal,
    private dataShareService: DataShareService,
    public agoraRTCStreamHandler: AgoraRtcStreamHandlerService
  ) {
    this.route.params.subscribe((params) => {
      if (params && params.event_code) {
        this.event_code = params.event_code;
        this.checkEventStatus();
      } else {
        this.router.navigate(["not-found"]);
      }
    });

    this.eventSocketService.connect().subscribe((x) => {
      console.log("event socket connected.", x);
    });

    //get subscribe trigger on profile img update
    this.castUserSubscription = this.dataShareService.castUser.subscribe(
      (user) => {
        if (user) {
          console.log("cast user", user);
          this.user = user;
          this.profilePicture = user.profile_picture;
          this.joinEventFG.controls.display_name.setValue(
            user.display_name ? user.display_name : user.full_name
          );
          this.joinEventFG.controls.tag_line.setValue(user.tag_line);
        }
      }
    );
  }

  ngOnInit() {
    this.user = getUserFromLocalStorage();
    this.profilePicture = this.user.profile_picture;

    this.joinEventFG = this.FB.group({
      display_name: [
        `${
          this.user.display_name ? this.user.display_name : this.user.full_name
        }`,
        [fieldIsRequired("Display Name")],
      ],
      tag_line: [`${this.user.tag_line}`],
      is_available_for_sidechat: [true],
      invited_email: [
        `${this.user.email}`,
        [fieldIsRequired("Email"), emailValidator()],
      ],
    });
  }

  ngOnDestroy() {
    if (this.socketJoined) {
      this.eventSocketService.leaveRoom(this.event.eventId);
    }

    //remove style and class and add old calss
    let newElement = document.querySelector('.new_login_page');
    if(newElement) {
      this.htmlEl.removeAttribute('style');
      this.htmlEl.classList.remove('new_login_page'); 
      this.htmlEl.classList.add('login_page');
    }
    
  }

  resetJoinEventFormGroup() {
    this.controlContainerSubmissionService.submitted.next(false);
    this.joinEventFG.reset();
    this.joinEventFG.patchValue({
      display_name: this.user.display_name,
      tag_line: this.user.tag_line,
      is_available_for_sidechat: true,
      invited_email: this.user.email,
    });
  }

  backToStep1() {
    this.activeBox = this.boxes.join_event_step1_box;
  }

  checkEventStatus() {
    this.serverError = null;
    this.loading = true;

    this.eventService.checkEventStatus(this.event_code).subscribe(
      (response: any) => {
        this.loading = false;

        if (response && response.is_success) {
          //this.toastr.success(response.message, 'Success');

          this.event = response.data.event;
          this.fanspace = response.data.fanspace;

          if (this.event.eventStatus == EventStatusEnum.PENDING) {
            this.activeBox = this.boxes.waiting_box;
          } else if (this.event.eventStatus == EventStatusEnum.STARTED) {
            this.activeBox = this.boxes.join_event_step1_box;
          } else {
            this.activeBox = this.boxes.event_ended_box;
          }

          //handle event ended status too...
          this.page_loader = false;

          if (!this.socketJoined) {
            this.socketJoined = true;
            this.eventSocketService
              .joinRoom(this.event.eventId)
              .subscribe((message) => {
                console.log("event socket join.", message);
              });

            this.eventSocketService
              .listenEventStarted()
              .subscribe((message) => {
                console.log("message from socket server ====>", message);
                if (
                  message &&
                  message.event_id &&
                  message.event_id == this.event.eventId
                ) {
                  //your logic goes here
                  this.activeBox = this.boxes.join_event_step1_box;
                }
              });
          }

          //get html element on class name and remove or add new class
          if(this.event?.eventSetting.eventPageImage) {
            this.htmlEl = document.querySelector('.prime-bg');
            this.htmlEl.classList.remove('login_page'); 
            this.htmlEl.classList.add('new_login_page'); 

            this.htmlEl.setAttribute('style', `background: url(${this.event.eventSetting.eventPageImage})  no-repeat; background-size: cover;`);
          }
        }
         else {
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
        } else {
          this.router.navigate(["not-found"]);
        }
      }
    );
  }

  submitJoinEventForm() {
    this.loading = false;
    if (this.joinEventFG.valid) {
      this.activeBox = this.boxes.join_event_step2_box;
    } else {
      return;
    }
  }

  joinEvent() {
    this.serverError = null;

    if (this.joinEventFG.valid) {
      this.loading = true;
      let value;
      if (
        !(
          this.agoraRTCStreamHandler.isAudioTrackExist() &&
          this.agoraRTCStreamHandler.isVideoTrackExist()
        )
      ) {
        value = {
          ...this.joinEventFG.value,
          event_id: this.event.eventId,
          raised_hand: false,
        };
      } else {
        value = {
          ...this.joinEventFG.value,
          event_id: this.event.eventId,
          raised_hand: true,
        };
      }
      
      this.eventService.joinEvent(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            if (response.data?.event) {
              //this.toastr.success(response.message, "Success");
            }

            let user: UserInterface = getUserFromLocalStorage();

            if (
              user.display_name !== this.joinEventFG.value.display_name ||
              user.tag_line !== this.joinEventFG.value.tag_line
            ) {
              user.display_name = this.joinEventFG.value.display_name;
              user.tag_line = this.joinEventFG.value.tag_line;
              setUserIntoLocalStorage(user);
            }
            this.agoraRTCStreamHandler.closeCameraMic();
            //this.resetJoinEventFormGroup();

            //redirect to .../event-attendee-dashboard/:event_code
            this.router.navigate([
              "/event/event-attendee-dashboard",
              this.event.eventCode,
            ]);
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

  readMoreLesstoggle() {
    this.isReadMore = !this.isReadMore;
  }

  /**
   * @author: Rajnee
   * @CreatedDate: 2021-06-16
   * @Description: use this function to open profile img model
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
   * @CreatedDate: 2021-06-16
   * @Description: use this function to open comman profile detail model
   **/
  openEditProfileModal() {
    const refModal = this.modalService.open(ProfileDetaiModalComponent, {
      backdrop: "static",
      keyboard: false,
      windowClass: "profile_change",
      centered: true,
    });
    refModal.componentInstance.profilePicture = this.profilePicture;
    refModal.componentInstance.userId = this.user.user_id;
  }

  goToDashboard() {
    this.router.navigate(["/dashboard"]);
  }
}
