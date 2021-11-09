import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { fieldIsRequired, postcodeValidator, onlyTextAndSpace, UserService, UserInterface, LocalstorageKeyEnum, RoleEnum } from 'src/app/shared';
import { setUserIntoLocalStorage, getUserFromLocalStorage } from 'src/app/shared/services/localstorage-user';
import { CommonService } from 'src/app/shared/services/common/common.service';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';
import { ProfileImgModalComponent } from 'src/app/shared/components/profile-img-modal/profile-img-modal.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})

export class ProfileComponent implements OnInit {
    //loading_zipcode = false;
    //zipcodes = [];
    //newCity;
    //selectedZip;

    genericError = "service is not available. please try again later."
    loading = false;
    page_loader = true;
    serverError: any = null;
    imagePro: string;
    countries: any;
    selectedCountry;
    countrycode;

    profileFG: FormGroup;
    user: UserInterface;
    castUserSubscription: Subscription;

    constructor(
        private _fb: FormBuilder,
        private commonService: CommonService,
        private userService: UserService,
        private router: Router,
        private toastr: ToastrService,
        private dataShareService: DataShareService,
        private modalService: NgbModal) {

        this.user = getUserFromLocalStorage();

        this.profileFG = this._fb.group({
            fullName: ['', [fieldIsRequired('Full name')]],
            displayName: ['', [fieldIsRequired('Display name')]],
            country: [''/* , [fieldIsRequired('Country')] */],
            city: ['', [onlyTextAndSpace('City')]],
            biography: [''],
            //zipCode: ['', [fieldIsRequired('Zip code')]]
        });

        //get subscribe trigger on profile img update
        this.castUserSubscription = this.dataShareService.castUser.subscribe(user => {
            if (user) {
                this.imagePro = user.profile_picture;
            }
        });
    }

    ngOnInit(): void {
        this.getUserProfile();
        this.getCountry();
    }

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
                zip_code: value.zipCode
            }

            this.userService.updateUserProfile(payload).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');

                        let user: UserInterface = getUserFromLocalStorage();
                        user.full_name = response.data.user.fullName;
                        user.display_name = response.data.user.displayName;
                        user.biography = response.data.user.biography;
                        user.city = response.data.user.city;
                        user.profile_picture = response.data.user.profilePicture;
                        //user.zip_code = response.data.user.zipCode;
                        user.country_id = response.data.user.country?.countryId;
                        user.country_name = response.data.user.country?.name;

                        setUserIntoLocalStorage(user);
                        this.dataShareService.updatedUserDetails(user);

                        let role = JSON.parse(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
                        if (role == RoleEnum.ATTENDEE) {
                            this.router.navigate(['/dashboard']);
                        }
                        else {
                            this.router.navigate(['/moderator-dashboard']);
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

    getCountry() {
        this.page_loader = true;
        this.commonService.getCountries().subscribe(
            (response: any) => {
                this.page_loader = false;
                if (response && response.is_success) {
                    this.countries = response.data.country;
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
            });
    }

    /*onChange($event) {
        this.selectedZip = "";
        this.newCity = "";
        this.zipcodes = [];
        this.countrycode = $event.countries_country_code.trim();
    }

    onChangeSearch(event) {
        if (event.term.length > 3) {
            this.zipChange(event);
        }
    }

    zipChange($event) {
        if (this.countrycode && $event.term) {
        //console.log(this.countrycode);
        this.loading_zipcode = true;
        let payload = {};
        payload = {
            country_code: this.countrycode,
            zipcode: $event.term
        };
        this.commonService.searchZipcode(payload).subscribe(
            (response: any) => {
                this.loading_zipcode = false;
                if (response && response.is_success) {
                    this.zipcodes = response.data.zipcodes.map(res => {
                        let label = `${res.postalCode} (${res.city})`;
                        return {
                            country: res.country,
                            zipcode: res.postalCode,
                            zipcodeLabel: label,
                            city: res.city
                        };
                    });
                }
                else {
                    this.serverError = response.message;
                    this.toastr.error(this.serverError, 'Error');
                }
            }, (err: HttpErrorResponse) => {
                this.loading_zipcode = false;
                if (err && err.error) {
                    this.serverError = err.error.message;
                } else {
                    this.serverError = this.genericError
                }
                this.toastr.error(this.serverError, 'Error');
            });
    }
}

selectEvent(event) {
 this.newCity = event.city;
}*/

    getUserProfile() {
        this.page_loader = true;
        this.userService.getUserDetails().subscribe((response: any) => {
            if (response && response.is_success) {
                /*let label = `${response.data.user.zipCode} (${response.data.user.city})`;
                this.zipcodes = [{
                    country: response.data.user.country.name,
                    zipcode: response.data.user.zipCode,
                    zipcodeLabel: label,
                    city: response.data.user.city
                }];*/

                this.profileFG.patchValue(response.data.user);
                this.profileFG.controls.country.setValue(null);
                if (response.data.user.country != "") {
                    this.profileFG.controls.country.setValue(response.data.user.country.countryId);
                    this.countrycode = response.data.user.country.countryCode.trim();
                }
                if (response.data.user.profilePicture != undefined) {
                    this.imagePro = response.data.user.profilePicture;
                }
                this.page_loader = false;

                /* let index = this.countries.findIndex((item) => item.countries_country_code.trim() === this.countrycode);

                if (index > -1) {
                    let country = this.countries.find((item) => item.countries_country_code.trim() === this.countrycode);

                    this.countries.splice(index, 1);
                    this.countries.splice(0, 0, country);
                } */
            }
        },
            (err: HttpErrorResponse) => {
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

    cancel() {
        this.router.navigate(['/moderator-dashboard']);
    }

    /**
    * @author: Rajnee
    * @CreatedDate: 2021-06-16
    * @Description: use this function to open comman profile model
    **/
    openProfileImgModal() {
        const refModal = this.modalService.open(ProfileImgModalComponent, { backdrop: 'static', keyboard: false, windowClass: "profile_change", centered: true });
        refModal.componentInstance.profilePicture = this.imagePro;
        refModal.componentInstance.userId = this.user.user_id;
    }
}
