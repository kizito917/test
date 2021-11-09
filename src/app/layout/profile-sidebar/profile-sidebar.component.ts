import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { LocalstorageKeyEnum,RoleEnum, UserInterface, UserService } from 'src/app/shared';
import { getUserFromLocalStorage,setUserIntoLocalStorage } from 'src/app/shared/services/localstorage-user';
import { DataShareService } from 'src/app/shared/services/data-share-services/data-share.service';
import { ProfileImgModalComponent } from 'src/app/shared/components/profile-img-modal/profile-img-modal.component';

@Component({
    selector: 'app-profile-sidebar',
    templateUrl: './profile-sidebar.component.html',
    styleUrls: ['./profile-sidebar.component.scss']
})

export class ProfileSidebarComponent implements OnInit, OnDestroy {
    profilePicture: string;
    tagline = '';
    serverError: any = null;
    isTaglineEdit = false;
    loading = false;
    genericError = "service is not available. please try again later."

    user: UserInterface;
    castUserSubscription: Subscription;

    constructor(
        private userService: UserService,
        private route: Router,
        private dataShareService: DataShareService,
        private modalService: NgbModal,
        private toastr: ToastrService) {

        this.castUserSubscription = this.dataShareService.castUser.subscribe(user => {
            if (user) {
                this.user = user;
                this.profilePicture = this.user.profile_picture;
            }
        });
    }

    ngOnInit() {
        this.user = getUserFromLocalStorage();
        this.tagline = this.user.tag_line;
        this.profilePicture = this.user.profile_picture;
    }

    ngOnDestroy() {
        this.castUserSubscription.unsubscribe();
    } 

    redirectToProfile() {
        this.route.navigate(['/profile']);
    }

    saveTagline(value) {
        if (value.trim()) {
            this.loading = true;

            let payload = {
                tag_line: value.trim()
            };

            this.userService.updateTagline(payload).subscribe(
                (response: any) => {
                    this.loading = false;
                    if (response && response.is_success) {
                        //this.toastr.success(response.message, 'Success');

                        this.tagline = response.data.user.tagLine;

                        let user = getUserFromLocalStorage();
                        user.tag_line = response.data.user.tagLine;
                        setUserIntoLocalStorage(user);

                        this.isTaglineEdit = false;
                        this.dataShareService.updatedUserDetails(user);

                        let role = JSON.parse(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
                        if (role == RoleEnum.ATTENDEE) {
                            this.route.navigate(['/dashboard']);
                        } 
                        else {
                            this.route.navigate(['/moderator-dashboard']);
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

    editTaglineToggale() {
        this.isTaglineEdit = true;
    }

    //open comman profile img popup
    openProfileImgModal() {
        const refModal = this.modalService.open(ProfileImgModalComponent, { backdrop: 'static', keyboard: false, windowClass: "profile_change", centered: true });
        refModal.componentInstance.profilePicture = this.profilePicture;
        refModal.componentInstance.userId = this.user.user_id;
    }
}
