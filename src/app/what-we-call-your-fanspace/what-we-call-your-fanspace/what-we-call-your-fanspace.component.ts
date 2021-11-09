import { Component, OnInit } from '@angular/core';
import { fieldIsRequired, RoleEnum, getUserFromLocalStorage, setUserIntoLocalStorage, StepEnum, LocalstorageKeyEnum, UserInterface } from 'src/app/shared';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FanspaceService } from 'src/app/shared/services/fanspace/fanspace.service';

@Component({
  selector: 'app-what-we-call-your-fanspace',
  templateUrl: './what-we-call-your-fanspace.component.html',
  styleUrls: ['./what-we-call-your-fanspace.component.scss']
})
export class WhatWeCallYourFanspaceComponent implements OnInit {

  public FG: FormGroup;
  public loading = false;
  public serverError: any = null;
  public genericError = "service is not available. please try again later.";
  public allow_back = false;

  constructor(
    private FB: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private fanspaceService: FanspaceService) { }

  ngOnInit() {

    if (localStorage.getItem(LocalstorageKeyEnum.STEP) && (localStorage.getItem(LocalstorageKeyEnum.STEP) === StepEnum.CREATE_NEW_FANSPACE)) {
      this.allow_back = true;
    }

    this.FG = this.FB.group({
      fanspace_name: ['', [fieldIsRequired('Fanspace name')]]
    });
  }

  onSubmit(valid, value) {
    this.serverError = null;
    if (valid) {
      this.loading = true;

      this.fanspaceService.createFanspace(value).subscribe((response: any) => {
        this.loading = false;

        if (response && response.is_success) {

          //console.log(response);

          //this.toastr.success(response.message, 'Success');

          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID, response.data.fanspace.fanspaceId);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID, `${RoleEnum.MODERATOR}`);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME, response.data.fanspace.fanspaceName);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, response.data.fanspace.logo);
          localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);

          let user: UserInterface = getUserFromLocalStorage();

          user.fanspace_count = user.fanspace_count + 1;

          setUserIntoLocalStorage(user);

          // After adding fanspace name, we have to redirect user to dashboard
          this.router.navigate(['/moderator-dashboard']);

        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, 'Error');
        }

      }, (err: HttpErrorResponse) => {
        this.loading = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError
        }
        this.toastr.error(this.serverError, 'Error');

        if (err && err.status && err.status == 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }

      });
    }
  }

  back() {
    if (localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID)) {
      localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);
      let role = parseInt(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
      if (role == RoleEnum.ATTENDEE){
          this.router.navigate(['/dashboard']);
      }else{
          this.router.navigate(['/moderator-dashboard']);
      }
    } else {
      localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.SELECT_FANSPACE);
      this.router.navigate(['/select-fanspace']);
    }
  }

}
