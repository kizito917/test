import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserInterface, UserService, onlyTextAndSpace, fieldIsRequired } from 'src/app/shared';
import { getUserFromLocalStorage, setUserIntoLocalStorage } from 'src/app/shared/services/localstorage-user';
import { CommonService } from 'src/app/shared/services/common/common.service';
import { ProfileImgModalComponent } from '../profile-img-modal/profile-img-modal.component';
import { Subscription } from 'rxjs';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';


@Component({
    selector: 'app-profile-detail-modal',
    templateUrl: './profile-detail-modal.component.html',
    styleUrls: ['./profile-detail-modal.component.scss']
})

export class ProfileDetaiModalComponent implements OnInit, OnDestroy {
    genericError = "service is not available. please try again later."
    serverError: string = null;
    countrycode;
    selectedCountry;
    pageLoader = true;
    loading = false;
    countries: any;

    @Input() eventId: string = '';
    @Input() profilePicture: string;
    @Input() userId: string;

    profileFG: FormGroup;
    user: UserInterface;
    castUserSubscription: Subscription;

    constructor(
        private FB: FormBuilder,
        public activeModal: NgbActiveModal,
        private userService: UserService,
        private toastr: ToastrService,
        private commonService: CommonService,
        private modalService: NgbModal,
        private dataShareService: DataShareService
    ) {

        this.profileFG = this.FB.group({
            fullName: ['', [fieldIsRequired('Full name')]],
            displayName: ['', [fieldIsRequired('Display name')]],
            country: [''],
            city: ['', [onlyTextAndSpace('City')]],
            biography: [''],
            tagLine: ['']
        });

        //get trigger when profile img is update
        this.castUserSubscription = this.dataShareService.castUser.subscribe(user => {
            if (user) {
                this.profilePicture = user.profile_picture;
            }
        });
    }

    ngOnInit() {
        this.getUserProfile();
        this.getCountry();
    }

    ngOnDestroy() {
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-08
    * @Description: use this function to open profile model
    **/
    openProfileImgModal() {
        const refModal = this.modalService.open(ProfileImgModalComponent, { backdrop: 'static', keyboard: false, windowClass: "profile_change", centered: true });
        refModal.componentInstance.eventId = this.eventId;
        refModal.componentInstance.profilePicture = this.profilePicture;
        refModal.componentInstance.userId = this.userId;
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-09
    * @Description: use this function to get user profile detail
    **/
    getUserProfile() {
        this.pageLoader = true;
        this.userService.getUserDetails().subscribe((response: any) => {
            this.pageLoader = false;
            if (response && response.is_success) {
                this.profileFG.patchValue(response.data.user);
                this.profileFG.controls.country.setValue(null);
                if (response.data.user.country != "") {
                    this.profileFG.controls.country.setValue(response.data.user.country.countryId);
                    this.countrycode = response.data.user.country.countryCode.trim();
                }
            }
        },
            (err: HttpErrorResponse) => {
                this.pageLoader = false;
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                }
                this.toastr.error(this.serverError, 'Error');
            });
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-09
    * @Description: use this function to get country list
    **/
    getCountry() {
        this.pageLoader = true;
        this.commonService.getCountries().subscribe((response: any) => {
            this.pageLoader = false;
            if (response && response.is_success) {
                this.countries = response.data.country;
            }
            else {
                this.serverError = response.message;
                this.toastr.error(this.serverError, 'Error');
            }
        },
            (err: HttpErrorResponse) => {
                this.pageLoader = false;
                this.serverError = this.genericError
                if (err && err.error) {
                    this.serverError = err.error.message;
                }
                this.toastr.error(this.serverError, 'Error');
            });
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-09
    * @Description: use this function to save user profile details
    **/
    submitProfileForm(valid, value) {
        this.serverError = null;
        if (valid) {
            this.loading = true;
            let payload = {
                full_name: value.fullName,
                display_name: value.displayName,
                city: value.city,
                country_id: value.country,
                bio: value.biography,
                event_id: this.eventId,
                tag_line: value.tagLine
            }

            this.userService.updateUserProfile(payload).subscribe((response: any) => {
                this.loading = false;
                if (response && response.is_success) {
                    //this.toastr.success(response.message, 'Success');

                    let user: UserInterface = getUserFromLocalStorage();
                    user.full_name = response.data.user.fullName;
                    user.display_name = response.data.user.displayName;
                    user.biography = response.data.user.biography;
                    user.city = response.data.user.city;
                    user.profile_picture = response.data.user.profilePicture;
                    user.country_id = response.data.user.country?.countryId;
                    user.country_name = response.data.user.country?.name;
                    user.tag_line = response.data.user.tagLine;

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
    }

}
