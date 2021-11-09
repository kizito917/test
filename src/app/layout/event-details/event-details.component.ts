import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModalConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ExportToCsv } from 'export-to-csv';
import { FanspaceService } from 'src/app/shared/services/fanspace/fanspace.service';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';
import { EventStatusEnum } from 'src/app/shared/enums/event-status.enum';
import { emailValidator, fieldIsRequired, onlyTextAndSpace, commaValidator, LocalstorageKeyEnum, RoleEnum, EventService } from 'src/app/shared';

@Component({
    selector: 'app-event-details',
    templateUrl: './event-details.component.html',
    styleUrls: ['./event-details.component.scss']
})

export class EventDetailsComponent implements OnInit {
    event_statuses = {
        PENDING: EventStatusEnum.PENDING,
        STARTED: EventStatusEnum.STARTED,
        ENDED: EventStatusEnum.ENDED
    };

    csvOptions = {
        fieldSeparator: ',',
        filename: 'Event Guest List',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        showTitle: true,
        title: 'Guest List',
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
        //headers: ["Email Address", "Name Or Reference"]
    };

    genericError = "service is not available. please try again later."
    isEditGuest: boolean = false;
    isEventModerator: boolean = false;
    loading = false;
    indexStart = false;
    page_loader = true;
    serverError: any = null;
    add_guest_error_message = '';
    duplicate_guest_error_message = '';
    eventGuests = [];
    guestCount: number;
    fanspace_id: any;
    fanspaceData: any;
    event;
    event_id;
    deleteGuestId;
    invite_link;
    fanspace_name;
    hero_image = [];
    errorMessage = "";

    guestFG: FormGroup;
    private modalRef: NgbModalRef;
    private modalDeleteRef: NgbModalRef;

    constructor(
        private FB: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private modalConfig: NgbModalConfig,
        private modalService: NgbModal,
        private toastr: ToastrService,
        private dataShareService: DataShareService,
        private eventService: EventService,
        private fanspaceService: FanspaceService,
        public datepipe: DatePipe) {

        this.fanspace_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);
        this.fanspace_name = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME);

        this.route.params.subscribe(params => {
            if (params) {
                this.event_id = params.id;
                this.getEventDetaisById();
            }
            let role = JSON.parse(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
            this.isEventModerator = true;
            if (role == RoleEnum.ATTENDEE) {
                this.isEventModerator = false;
            }
            if (!this.isEventModerator) {
                this.getFanspaceDetails();
            }
        });
    }

    ngOnInit() {
        this.guestFG = this.FB.group({
            guest_users: this.FB.array([this.newGuest()]),
            email_address: ['', [commaValidator()]],
            reference_name: ['', [onlyTextAndSpace('Name')]],
        });
    }

    async getEventDetaisById() {
        this.page_loader = true;
        this.eventService.getEventById(this.event_id).subscribe(
            (response: any) => {
                this.page_loader = false;

                if (response && response.is_success) {
                    this.event = response.data.event;

                    if (!this.isEventModerator && !this.event.isPublished) {
                        this.router.navigate(['/']);
                    }

                    this.invite_link = location.origin + '/' + 'invite' + '/' + response.data.event.eventCode;
                    this.isEditGuest = response.data.event.eventSetting.allowGuestOnly;

                    if (this.isEditGuest && this.isEventModerator) {
                        this.getEventGuestsByEventId();
                    }
                }
                else {
                    this.serverError = response.message;
                    this.toastr.error(this.serverError, 'Error');
                }
            }, (err: HttpErrorResponse) => {
                this.page_loader = false;
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                }
                this.toastr.error(this.serverError, 'Error');

                if (err && err.status && err.status == 401) {
                    localStorage.clear();
                    this.router.navigate(['/login']);
                }
            });
    }

    openGuestModal(content) {
        this.add_guest_error_message = "";
        this.duplicate_guest_error_message = "";
        this.guestFG.reset();
        this.openModel(content, 'guest_window');
        //this.modalRef = this.modalService.open(content,{ windowClass:'guest_window', centered: true, backdrop : 'static',keyboard : false});
    }

    guest_users(): FormArray {
        return this.guestFG.get("guest_users") as FormArray
    }

    newGuest(): FormGroup {
        return this.FB.group({
            email: ['', [emailValidator()]],
            name: ['', [onlyTextAndSpace('Name')]],
        })
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
        }
        else {
            this.add_guest_error_message = "Please enter value";
            return;
        }
    }

    removeGuests(i: number) {
        this.guest_users().removeAt(i);
        if (this.guest_users().controls.length == 1) {
            this.indexStart = false;
        }
        else {
            this.indexStart = true;
        }
    }

    submitGuestForm(valid, value) {
        this.add_guest_error_message = "";
        this.duplicate_guest_error_message = "";

        if (valid) {
            this.loading = true;

            let email_address = [];
            if (value.email_address) {
                email_address = value.email_address.split(',');
            }

            let guestuseremails = value.guest_users.map(guestuser => guestuser.email);
            guestuseremails = guestuseremails.filter(email => email !== null && email !== '');

            let guestusernames = value.guest_users.map(guestuser => guestuser.name);
            guestusernames = guestusernames.filter(name => name !== null && name !== '');

            let allguestuseremails = guestuseremails.concat(email_address);
            const unique_guestuseremails = new Set(allguestuseremails.map(email => email));

            if (unique_guestuseremails.size < allguestuseremails.length) {
                this.loading = false;
                this.duplicate_guest_error_message = "Duplicates email not allow";
                return false;
            }

            let payload = {
                event_id: this.event_id,
                guest_users: [],
                email_address: '',
                reference_name: ''
            };

            if (value.guest_users.length > 0 && !value.email_address && !value.reference_name) {
                const is_guests_valid = value.guest_users.every(item => item.email && item.name);

                if (!is_guests_valid) {
                    this.loading = false;
                    this.duplicate_guest_error_message = "Please enter value";
                    return false;
                }
                payload.guest_users = value.guest_users;
            }
            else if (value.guest_users.length > 0 && value.email_address && value.reference_name) {
                const is_guests_valid = value.guest_users.every(item => item.email && item.name);

                if (is_guests_valid) {
                    payload.guest_users = value.guest_users;
                    payload.email_address = value.email_address;
                    payload.reference_name = value.reference_name;
                }
                else if (guestuseremails.length > 0 || guestusernames.length > 0) {
                    this.loading = false;
                    this.duplicate_guest_error_message = "Please enter value";
                    return false;
                }
                else {
                    payload.email_address = value.email_address;
                    payload.reference_name = value.reference_name;
                }
            }
            else {
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
                                let existEmail = Array.prototype.map.call(response.data.already_exist_guest_users, res => res.email).toString();
                                this.toastr.warning(`Guest already exist  ${existEmail}`, 'Warning');
                            }
                            else {
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
                    }
                    else {
                        this.serverError = response.message;
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

    getEventGuestsByEventId() {
        this.loading = true;
        this.eventService.getGuestsByEventId(this.event_id).subscribe(
            (response: any) => {
                this.loading = false;

                if (response && response.is_success) {
                    this.eventGuests = response.data.guests;
                    this.guestCount = response.data.count;
                }
                else {
                    this.serverError = response.message;
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

    downloadCSV() {
        let guestsData = [];
        for (let i = 0; i < this.eventGuests.length; i++) {
            guestsData.push({
                email: this.eventGuests[i].email,
                name: this.eventGuests[i].name,
            })
        }
        const csvExporter = new ExportToCsv(this.csvOptions);
        if (guestsData.length > 0) {
            csvExporter.generateCsv(guestsData);
        }
    }

    isGuestAllowOnly(value) {
        this.loading = true;

        let payload = {
            event_id: this.event_id,
            allow_guest_only: value,
        };

        this.eventService.updateGuestSetting(payload).subscribe(
            (response: any) => {
                this.loading = false;

                if (response && response.is_success) {
                    this.isEditGuest = !this.isEditGuest;

                    if (this.isEditGuest && this.isEventModerator) {
                        this.getEventGuestsByEventId();
                    }
                    //this.toastr.success(response.message, 'Success');
                }
                else {
                    this.serverError = response.message;
                    this.toastr.error(this.serverError, 'Error');
                }
            },
            (err: HttpErrorResponse) => {
                this.loading = false;
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                }
                this.toastr.error(this.serverError, 'Error');
            });
    }

    deleteGuest(content, id) {
        this.modalDeleteRef = this.modalService.open(content, {
            windowClass: 'guestdelete_window',
            centered: true,
            backdrop: 'static',
            keyboard: false
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
                    this.modalDeleteRef.close();

                    if (response.data && response.data.guest_user) {
                        this.eventGuests = this.eventGuests.filter(user => user.eventGuestUserId != response.data.guest_user.eventGuestUserId);
                        this.guestCount = this.eventGuests.length;
                    }
                }
                else {
                    this.serverError = response.message;
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

    publishUnpublishEvent(value) {
        this.loading = true;
        let payload = {
            event_id: this.event_id,
            is_published: value
        };

        this.eventService.publishUnpublishEvent(payload).subscribe(
            (response: any) => {
                this.loading = false;
                if (response && response.is_success) {
                    //this.toastr.success(response.message, 'Success');
                    this.modalRef.close();
                    this.dataShareService.publishedNewEvent(response.data.event);

                    this.event.isPublished = value;
                }
                else {
                    this.serverError = response.message;
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
        this.toastr.success('Link copied to clipboard.', 'Success');
    }

    deleteEvent() {
        this.loading = true;
        this.eventService.deleteEvent(this.event_id).subscribe(
            (response: any) => {
                this.loading = false;
                if (response && response.is_success) {
                    //this.toastr.success(response.message, 'Success');
                    this.modalRef.close();

                    this.dataShareService.deletedEventById(response.data.event.eventId);
                    this.router.navigate(['/moderator-dashboard']);
                }
                else {
                    if (response.data?.code === 'E001') {
                        this.modalRef.close();
                        //this.toastr.success(response.message, 'Success');
                        this.router.navigate(['/login']);
                    }
                    else {
                        this.serverError = response.message;
                        this.toastr.error(this.serverError, 'Error');
                    }
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

    enterEventStudio(eventCode) {
        //localStorage.setItem(LocalstorageKeyEnum.SELECTED_EVENT_ID, eventId);
        this.router.navigate(['/event', 'event-moderator-dashboard', eventCode]);
    }

    copyInvitation() {
        let copyText = `${this.fanspace_name} is inviting you to a scheduled event on Billions:

        ${this.event.eventName}
        ${this.event.scheduleStartTime ? this.datepipe.transform(new Date(this.event.scheduleStartTime), 'MMMM d') : ''}  ${this.event.scheduleStartTime ? this.datepipe.transform(new Date(this.event.scheduleStartTime), 'h:mm a') : ''} 

        Join on your computer

        link : ${this.invite_link}`;

        const el = document.createElement('textarea');
        el.value = copyText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        this.toastr.success('Invitation copied to clipboard.', 'Success');
    }

    async getFanspaceDetails() {
        this.page_loader = true;

        this.fanspaceService.getFanspaceDetails(this.fanspace_id).subscribe(
            (response: any) => {
                this.page_loader = false;
                if (response && response.is_success) {
                    this.fanspaceData = response.data.fanspace;
                }
                else {
                    this.serverError = response.message;
                    this.toastr.error(this.serverError, 'Error');
                }
            }, (err: HttpErrorResponse) => {
                this.page_loader = false;
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                }
                this.toastr.error(this.serverError, 'Error');

                if (err && err.status && err.status == 401) {
                    localStorage.clear();
                    this.router.navigate(['/login']);
                }
            });
    }

    enterIntoEvent() {
        this.router.navigate(['/event/join', this.event.eventCode]);
    }

    copyEvent() {
        this.serverError = null;

        if (this.event.eventId) {
            this.loading = true;

            let value = {
                event_id: this.event_id
            };

            this.eventService.copyEvent(value).subscribe(
                (response: any) => {
                    this.loading = false;

                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');
                        this.modalRef.close();
                        this.dataShareService.addedNewEvent(response.data.event);
                    }
                    else {
                        this.serverError = response.message;
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

    //open model popup
    openModel(content, class_name = '') {
        this.modalRef = this.modalService.open(content, { windowClass: class_name, centered: true, backdrop: 'static', keyboard: false });

        this.hero_image = [];
        this.errorMessage = '';
    }

    //close the model and clear error messages
    closeModel() {
        this.hero_image = [];
        this.errorMessage = '';
        this.modalRef.close();
    }

    //select image file and check validation
    onHeroImageSelect(event) {
        this.errorMessage = '';
        if (this.hero_image.length === 1) {
            this.toastr.error("Please remove image first", 'Error');
            return;
        }
        if (event.rejectedFiles.length > 0) {
            if (event.rejectedFiles[0].size > 5000000) {
                this.toastr.error("Please select a file less than 5mb", 'Error');
                return;
            }
        }
        this.hero_image.push(...event.addedFiles);
        // this.selected_fanspace_logo_source = this.hero_image[0];
    }

    //remove selected image
    onRemove(event) {
        this.hero_image.splice(this.hero_image.indexOf(event), 1);
    }

    //call api function and save hero image
    saveHeroImage() {
        this.errorMessage = '';
        if ((this.hero_image[0] == undefined || this.hero_image[0] == '')) {
            this.errorMessage = "Please select image";
            return;
        }
        this.loading = true;

        let formdata = new FormData();
        formdata.append('event_page_image', this.hero_image[0]);

        this.fanspaceService.uploadHeroImage(formdata, this.event.eventSetting?.eventSettingId).subscribe(
            (response: any) => {
                this.loading = false;
                if (response && response.is_success) {
                    this.event.eventSetting.eventPageImage = response.data.eventSetting.eventPageImage;
                    //this.toastr.success(response.message, 'Success');
                    this.modalRef.close();
                }
                else {
                    this.serverError = response.message;
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
