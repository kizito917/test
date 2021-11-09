import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService, UserService, fieldIsRequired, getUserFromLocalStorage, setUserIntoLocalStorage, RoleEnum, StepEnum, LocalstorageKeyEnum, UserInterface } from 'src/app/shared';
import { HttpErrorResponse } from '@angular/common/http';
import { parse } from 'url';

@Component({
  selector: 'app-whats-your-name',
  templateUrl: './whats-your-name.component.html',
  styleUrls: ['./whats-your-name.component.scss']
})
export class WhatsYourNameComponent implements OnInit {

  public FG: FormGroup;
  public loading = false;
  public serverError: any = null;
  public genericError = "service is not available. please try again later.";
  is3step: boolean = false;
  constructor(
    private FB: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private userService: UserService) { }

  ngOnInit() {
    this.checkAccess();
    
    this.FG = this.FB.group({
      full_name: ['', [fieldIsRequired('Full name')]]
    });

  }

  onSubmit(valid, value) {
    this.serverError = null;
    if (valid) {
      this.loading = true;

      this.userService.saveUserFullName(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');

            let user : UserInterface = getUserFromLocalStorage();

            user.full_name = value.full_name;

            setUserIntoLocalStorage(user);

            if (user.role_id == RoleEnum.MODERATOR && user.fanspace_count < 1) {
              localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.WHAT_WE_CALL_YOUR_FANSPACE);
              this.router.navigate(['/what-we-call-your-fanspace']);
              return;
            }

            if (!localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID)) {
              localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.SELECT_FANSPACE);
              this.router.navigate(['/select-fanspace']);
              return;
            }

            localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);

            if (localStorage.getItem(LocalstorageKeyEnum.PREVIOUS_URL) && localStorage.getItem(LocalstorageKeyEnum.PREVIOUS_URL).includes('event/join')) {
              this.router.navigate([`${localStorage.getItem(LocalstorageKeyEnum.PREVIOUS_URL)}`]);
              localStorage.setItem(LocalstorageKeyEnum.PREVIOUS_URL, '');
              return;
            }

            this.router.navigate(['/']);

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

  checkAccess() {
    if (localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID)) {
      let role = parseInt(localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID));
      if (role == RoleEnum.ATTENDEE) {
        this.is3step = false;
      } else {
        this.is3step = true;
      }
    }
  }

}
