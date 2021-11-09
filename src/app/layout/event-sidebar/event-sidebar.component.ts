import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgbModalConfig, NgbModal,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { emailValidator,fieldIsRequired,LocalstorageKeyEnum,StepEnum,RoleEnum, EventService} from 'src/app/shared';
import { ControlContainerSubmissionService } from 'src/app/shared/components/control-container/control-container-submission.service';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';

@Component({
    selector: 'app-event-sidebar',
    templateUrl: './event-sidebar.component.html',
    styleUrls: ['./event-sidebar.component.scss']
})

export class EventSidebarComponent implements OnInit, OnDestroy {
    private modalRef: NgbModalRef;
    eventFG: FormGroup;

    @ViewChild('eventModal') eventModal: any;

    genericError = "service is not available. please try again later."
    isEventModerator:boolean=false;
    loading = false;
    serverError: any = null;
    events_history = [];
    events = [];
    fanspace_id: any;
    fanspaceData: any;

    castNewEventSubscription: Subscription;
    castFanspaceSubscription: Subscription;
    castDeletedEventIdSubscription: Subscription;
    castpublishedEventSubscription: Subscription;
    castAccessSubscription: Subscription;
    castEventsSubscription: Subscription;

    constructor(
        private FB: FormBuilder,
        private modalConfig: NgbModalConfig,
        private modalService: NgbModal,
        private toastr: ToastrService,
        private router: Router,
        private dataShareService: DataShareService,
        private controlContainerSubmissionService: ControlContainerSubmissionService,
        private eventService: EventService) {

        this.eventFG = this.FB.group({
            event_name: ['', [fieldIsRequired('Name')]]
        });

        this.castNewEventSubscription = this.dataShareService.castNewEvent.subscribe(event => { if (event) { this.events.push(event); } });
        this.castFanspaceSubscription = this.dataShareService.castFanspace.subscribe(fanspace => { if (fanspace) { this.fanspaceData = fanspace } });

        this.castDeletedEventIdSubscription = this.dataShareService.castDeletedEventId.subscribe(id => {
            if (id) { 
                this.events = this.events.filter(x => x.eventId !== id); 
                this.events_history = this.events_history.filter(x => x.eventId !== id); 
            } 
        });

        this.castpublishedEventSubscription = this.dataShareService.castpublishedEvent.subscribe(event => { if (event) { this.events[this.events.findIndex(el => el.eventId === event.eventId)] = event } });
        this.castAccessSubscription = this.dataShareService.castAccess.subscribe(access => (this.isEventModerator = access));
        this.castEventsSubscription = this.dataShareService.castEvents.subscribe(list => { if (list && list.events.length > 0) { 
            this.events = list.events; 
            this.events_history = list.events_history;
            this.fanspaceData.userCount = list.fanspace_users;
            localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_USERS_COUNT, list.fanspace_users);
        } });
    }

    ngOnInit() {
        this.getfanspaceDetailsFromLS();
        this.getAllEvents();
        this.getFanSpaceRole();
    }

    ngOnDestroy() {
        this.castNewEventSubscription.unsubscribe();
        this.castFanspaceSubscription.unsubscribe();
        this.castDeletedEventIdSubscription.unsubscribe();
        this.castpublishedEventSubscription.unsubscribe();
        this.castAccessSubscription.unsubscribe();
        this.castEventsSubscription.unsubscribe();
    }  

    createNewEvent(content) {
        this.controlContainerSubmissionService.submitted.next(false);
        this.eventFG.reset();
        this.modalRef = this.modalService.open(content, { windowClass: 'creat_event_modal', centered: true, backdrop: 'static', keyboard : false });
    }

    submitEventForm(valid, value) {
        if (valid) {
            this.loading = true;
            this.fanspace_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);
            let payload = {
                ...value,
                fanspace_id: this.fanspace_id,
            };

            this.eventService.addEvent(payload).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');
                        this.modalRef.close();
                        this.events.push(response.data.event);
                        this.router.navigate(['/event-detail', response.data.event.eventId]);
                    }
                    else {
                        this.serverError = response.message;
                        console.log(this.serverError);
                        this.toastr.error(this.serverError, 'Error');
                    }
                }, (err: HttpErrorResponse) => {
                    this.loading = false;
                    this.serverError = this.genericError
                    if (err && err.error) {
                        this.serverError = err.error.message;
                    } 
                    this.toastr.error(this.serverError, 'Error');

                });
        }
    }

    getAllEvents() {
        this.fanspace_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);
        this.eventService.getAllEvents(this.fanspace_id).subscribe(
            (response: any) => {
                if (response && response.is_success) {
                    this.events = response.data.events;
                    this.events_history = response.data.events_history;
                }
                else {
                    this.serverError = response.message;
                    this.toastr.error(this.serverError, 'Error');
                }
            }, (err: HttpErrorResponse) => {
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                } 
                this.toastr.error(this.serverError, 'Error');

                if (err && err.status && err.status == 401 ) {
                    localStorage.clear();
                    this.router.navigate(['/login']);
                }

            });
    }

    getfanspaceDetailsFromLS() {
        this.fanspaceData = {
            fanspaceName: localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME),
            logo: localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO),
            userCount: localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_USERS_COUNT)
        }
    }

    editFanSpace() {
        this.router.navigate(['/edit-fanspace']);
    }

    onLoggedoutFromFanspace() {
        localStorage.removeItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);
        localStorage.removeItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID);
        localStorage.removeItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME);
        localStorage.removeItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO);
        localStorage.removeItem(LocalstorageKeyEnum.SELECTED_FANSPACE_USERS_COUNT);
        localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.SELECT_FANSPACE);
        this.modalRef.close();
        this.router.navigate(['/select-fanspace']);
    }

    createNewFanSpace() {
        localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.CREATE_NEW_FANSPACE);
        this.router.navigate(['/what-we-call-your-fanspace']);
    }

    getFanSpaceRole(){
        let role=JSON.parse(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
        this.isEventModerator=true;
        if (role == RoleEnum.ATTENDEE){
            this.isEventModerator=false;
        }
    }

    openlogoutModal(content) {
        this.modalRef = this.modalService.open(content, {
            windowClass: 'logout_conformation_window',
            centered: true,
            backdrop: 'static',
            keyboard : false
        });
    }
}
