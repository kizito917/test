import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserInterface, UserService } from 'src/app/shared';
import { getUserFromLocalStorage, setUserIntoLocalStorage } from 'src/app/shared/services/localstorage-user';
import { DataShareService } from '../../services/data-share-services/data-share.service';

@Component({
    selector: 'app-profile-img-modal',
    templateUrl: './profile-img-modal.component.html',
    styleUrls: ['./profile-img-modal.component.scss']
})

export class ProfileImgModalComponent implements OnInit, OnDestroy {
    genericError = "service is not available. please try again later."
    serverError: string = null;
    profileError: string = ''
    selectedProfilePic: any;
    loading = false;

    @Input() eventId: string = '';
    @Input() profilePicture: string;
    @Input() userId: string;

    user: UserInterface;

    constructor(
        public activeModal: NgbActiveModal,
        private userService: UserService,
        private toastr: ToastrService,
        private dataShareService: DataShareService
    ) {
    }

    ngOnInit() {
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-08
    * @Description: use this function to handle file when select a file
    **/
    onFileChange(event) {
        this.profileError = '';
        this.selectedProfilePic = '';

        if (event.target.files && event.target.files.length) {
            const [file] = event.target.files;
            if (file.type.match(/image\/*/) == null) {
                this.profileError = "Only images are supported.";
                return;
            }
            if (file.size > 5000000) {
                this.profileError = "File too Big, please select a file less than 5mb.";
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                this.profilePicture = reader.result as string;
            };
            this.selectedProfilePic = event.target.files[0];
        }
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-08
    * @Description: use this function to save profile pic
    **/
    saveProfilePicture() {
        this.profileError = '';
        if (!this.userId) {
            this.toastr.error(this.genericError, 'Error');
            return;
        }

        if (this.profilePicture && this.profilePicture != undefined) {
            this.loading = true;
            let formdata = new FormData();
            formdata.append('profile_pic', this.selectedProfilePic);
            formdata.append('event_id', this.eventId);

            this.userService.changeProfilePicture(formdata, this.userId).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');

                        let user: UserInterface = getUserFromLocalStorage();
                        user.profile_picture = response.data.user.profilePicture;
                        setUserIntoLocalStorage(user);
                        this.dataShareService.updatedUserDetails(user);

                        this.activeModal.close()
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
        else {
            this.profileError = 'please select image';
        }
    }

    ngOnDestroy() {
    }

}
