import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { Observable,Observer } from "rxjs";
import { fieldIsRequired,onlyTextAndSpace, LocalstorageKeyEnum } from 'src/app/shared';
import { FanspaceService } from 'src/app/shared/services/fanspace/fanspace.service';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';

@Component({
    selector: 'app-edit-fanspace',
    templateUrl: './edit-fanspace.component.html',
    styleUrls: ['./edit-fanspace.component.scss']
})

export class EditFanspaceComponent implements OnInit {
    editFanspaceFG: FormGroup;
    private modalRef: NgbModalRef;

    genericError = "service is not available. please try again later.";
    fanspaceData: { fanspace_id: any, fanspace_name: any };
    loading = false;
    page_loader = true;
    serverError: any = null;
    files: File[] = [];
    selected_fanspace_logo_source: any;
    image_fanspace_logo_preview: any;
    fanspace_logo_upload_file: any;
    error_message = '';
    past_url = '';

    constructor(
        private FB: FormBuilder,
        private fanspaceService: FanspaceService,
        private router: Router,
        private modalService: NgbModal,
        private dataShareService: DataShareService,
        private toastr: ToastrService) {

        this.editFanspaceFG = this.FB.group({
            fanspaceName: ['', [fieldIsRequired('Name')]],
            description: ['']
        });
    }

    ngOnInit() {
        this.fanspaceData = {
            fanspace_id: localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID),
            fanspace_name: localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME)
        }
        this.getFanspaceDetails();
    }

    submitEditFanspaceForm(valid, value) {
        this.serverError = null;
        if (valid) {
            this.loading = true;
            let payload = {
                fanspace_name: value.fanspaceName,
                description: value.description
            };

            this.fanspaceService.updateFanspace(payload, this.fanspaceData.fanspace_id).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');

                        localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, response.data.fanspace.logo);
                        localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME, response.data.fanspace.fanspaceName);

                        this.dataShareService.updatedFanspace(response.data.fanspace);

                        this.router.navigate(['/moderator-dashboard']);
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

    getFanspaceDetails() {
        this.page_loader = true;
        this.fanspaceService.getFanspaceDetails(this.fanspaceData.fanspace_id).subscribe(
            (response: any) => {
                this.page_loader = false;
                if (response && response.is_success) {
                    this.editFanspaceFG.patchValue(response.data.fanspace);
                    if (response.data.fanspace.logo) {
                        this.image_fanspace_logo_preview = response.data.fanspace.logo;
                        this.fanspace_logo_upload_file = response.data.fanspace.logo;
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
        if (past_url.trim() == '' && (this.selected_fanspace_logo_source == undefined || this.selected_fanspace_logo_source == '')) {
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

            this.fanspaceService.changeFanspaceLogo(formdata, this.fanspaceData.fanspace_id).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');

                        this.image_fanspace_logo_preview  = response.data.fanspace.logo;
                        localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, response.data.fanspace.logo);
                        this.dataShareService.updatedFanspace(response.data.fanspace);
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

    cancel() {
        this.router.navigate(['/moderator-dashboard']);
    }
}
