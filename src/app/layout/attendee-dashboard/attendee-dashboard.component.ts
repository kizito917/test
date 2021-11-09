import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FanspaceService } from 'src/app/shared/services/fanspace/fanspace.service';
import { LocalstorageKeyEnum, RoleEnum } from 'src/app/shared';

@Component({
    selector: 'app-attendee-dashboard',
    templateUrl: './attendee-dashboard.component.html',
    styleUrls: ['./attendee-dashboard.component.scss']
})

export class AttendeeDashboardComponent implements OnInit {
    loading = false;
    page_loader = true;
    genericError = "service is not available. please try again later."
    serverError: any = null;
    fanspace_id: any;
    fanspaceData: any;

    constructor(
        private fanspaceService: FanspaceService,
        private toastr: ToastrService,
        private router: Router) {

        let selected_fanspace_role_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID);
        if (selected_fanspace_role_id && parseInt(selected_fanspace_role_id) != RoleEnum.ATTENDEE) {
            this.router.navigate(['/moderator-dashboard']);
        }
    }

    ngOnInit(): void {
        this.getFanspaceDetails();
    }

    async getFanspaceDetails() {
        this.page_loader = true;
        this.fanspace_id = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID);
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

}
