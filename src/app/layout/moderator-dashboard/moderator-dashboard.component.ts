import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModalConfig, NgbModal,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { Observable,Observer, Subscription } from "rxjs";
import { emailValidator, fieldIsRequired,LocalstorageKeyEnum, RoleEnum, EventService } from 'src/app/shared';
import { FanspaceService } from 'src/app/shared/services/fanspace/fanspace.service';
import { ControlContainerSubmissionService } from 'src/app/shared/components/control-container/control-container-submission.service';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';

@Component({
    selector: 'app-moderator-dashboard',
    templateUrl: './moderator-dashboard.component.html',
    styleUrls: ['./moderator-dashboard.component.scss']
})

export class ModeratorDashboardComponent implements OnInit {
    private modalRef: NgbModalRef;
    eventFG: FormGroup;

    @ViewChild('eventModal') eventModal: any;
    castFanspaceSub: Subscription;

    genericError = "service is not available. please try again later."
    loading = false;
    page_loader = true;
    serverError: any = null;
    files: File[] = [];
    fanspace_id: any;
    fanspaceData: any;
    selected_fanspace_logo_source: any;
    image_fanspace_logo_preview: any;
    fanspace_logo_upload_file: any;
    past_url = '';
    error_message = '';

    constructor(
        private FB: FormBuilder,
        private modalConfig: NgbModalConfig,
        private modalService: NgbModal,
        private toastr: ToastrService,
        private router: Router,
        private dataShareService: DataShareService,
        private fanspaceService: FanspaceService,
        private controlContainerSubmissionService: ControlContainerSubmissionService,
        private eventService: EventService) {

        let selected_fanspace_role_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID);
        if (selected_fanspace_role_id && parseInt(selected_fanspace_role_id) != RoleEnum.MODERATOR) {
            this.router.navigate(['/dashboard']);
        }

        this.fanspace_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);

        this.eventFG = this.FB.group({
            event_name: ['', [fieldIsRequired('Name')]]
        });

        //get fanspace change subscrib trigger
        this.castFanspaceSub = this.dataShareService.castFanspace.subscribe(fanspace => { 
            if (fanspace) { this.fanspaceData = fanspace } 
        });
    }

    ngOnInit() {
        this.getFanspaceDetails();
    }

    createNewEvent(content) {
        this.controlContainerSubmissionService.submitted.next(false);
        this.eventFG.reset();
        this.modalRef = this.modalService.open(content, { windowClass: 'creat_event_modal', centered: true, backdrop: 'static',keyboard : false });
    }

    submitEventForm(valid, value) {
        if (valid) {
            this.loading = true;

            let payload = {
                ...value,
                fanspace_id: this.fanspace_id
            };

            this.eventService.addEvent(payload).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');
                        this.modalRef.close();
                        this.dataShareService.addedNewEvent(response.data.event);
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

    async getFanspaceDetails() {
        this.page_loader = true;

        this.fanspaceService.getFanspaceDetails(this.fanspace_id).subscribe(
            (response: any) => {
                this.page_loader = false;
                if (response && response.is_success) {
                    this.fanspaceData = response.data.fanspace;
                    localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_USERS_COUNT, response.data?.fanspace_users);
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

    editFanspace() {
        this.router.navigate(['/edit-fanspace']);
    }

    openFanspaceLogoChangeModal(content) {
        this.files = [];
        this.selected_fanspace_logo_source = '';
        this.past_url = '';
        this.error_message = '';
        this.modalRef = this.modalService.open(content, { windowClass: 'creat_fanspacelogo_modal', centered: true, backdrop: 'static' });
    }

    closeModel() {
        this.files = [];
        this.selected_fanspace_logo_source = '';
        this.fanspace_logo_upload_file='';
        this.past_url = '';
        this.modalRef.close();
    }

    onSelect(event) {
        if (this.files.length === 1) {
            this.toastr.error("Please remove image first", 'Error');
            return;
        }
        if(event.rejectedFiles.length >0){
            if(event.rejectedFiles[0].size > 5000000){
                this.toastr.error("Please select a file less than 5mb", 'Error');
                return; 
            }
        }
        this.files.push(...event.addedFiles);
        this.selected_fanspace_logo_source = this.files[0];
    }

    onRemove(event) {
        this.selected_fanspace_logo_source = '';
        this.files.splice(this.files.indexOf(event), 1);
    }

    saveLogo(past_url) {
        this.error_message = '';

        if (past_url.trim() != '' && (this.selected_fanspace_logo_source != undefined && this.selected_fanspace_logo_source != '')) {
            this.error_message = "Please select only one logo";
            return;
        } 
        else if (past_url.trim() == '' && (this.selected_fanspace_logo_source == undefined || this.selected_fanspace_logo_source == '')) {
            this.error_message = "Please select at least one logo";
            return;
        }
        if (past_url.trim()) {
            this.getBase64ImageFromURL(past_url).subscribe(base64data => {
                this.image_fanspace_logo_preview = "data:image/jpg;base64," + base64data;
                this.fanspace_logo_upload_file = this.image_fanspace_logo_preview;
            });
        }
        else {
            this.fanspace_logo_upload_file = this.selected_fanspace_logo_source;
        }

        if(this.error_message =='' && this.fanspace_logo_upload_file != undefined){
            this.loading = true;

            let formdata = new FormData();
            formdata.append('logo', this.fanspace_logo_upload_file);

            this.fanspaceService.changeFanspaceLogo(formdata,this.fanspace_id).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        this.fanspaceData = response.data.fanspace;

                        localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, response.data.fanspace.logo);

                        //this.toastr.success(response.message, 'Success');

                        this.dataShareService.updatedFanspace(response.data.fanspace);

                        this.modalRef.close();
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

    getBase64ImageFromURL(url: string) {
        return Observable.create((observer: Observer<string>) => {
            let img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;

            if (!img.complete) {
                img.onload = () => {
                    observer.next(this.getBase64Image(img));
                    observer.complete();
                };
                img.onerror = err => {
                    observer.error(err);
                    this.error_message = "Enter url is not valid or not allowed";
                    return;
                };
            } 
            else {
                observer.next(this.getBase64Image(img));
                observer.complete();
            }
        });
    }

    getBase64Image(img: HTMLImageElement) {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL("image/png");
        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    }

}
