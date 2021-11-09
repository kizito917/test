import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { emailValidator, fieldIsRequired, AuthService, RoleEnum, UserService, getUserFromLocalStorage, setUserIntoLocalStorage, StepEnum, LocalstorageKeyEnum } from 'src/app/shared';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
    selector: 'app-moderator-signup',
    templateUrl: './moderator-signup.component.html',
    styleUrls: ['./moderator-signup.component.scss'],
    providers: [NgbModalConfig, NgbModal]
})
export class ModeratorSignupComponent implements OnInit {

  public signupFG: FormGroup;
  public loading = false;
  public serverError: any = null;
  public email = '';
  public inValidPasscode = true;
  public genericError = "service is not available. please try again later.";
  public showEmailBox = true;
  public showPasscodeBox = false;

  otp: string;
  showOtpComponent = true;
  @ViewChild('ngOtpInput', { static: false }) ngOtpInput: any;
  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    /* inputStyles: {
        'width': '50px',
        'height': '50px'
    } */
  };

  constructor(
    private FB: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {

    if (authService.isLoggedIn()) {
      this.router.navigate(['/']);
    } else {
      localStorage.clear();
    }

    this.signupFG = this.FB.group({
      email: ['', [fieldIsRequired('Email'), emailValidator()]]
    });

  }

  ngOnInit() {
    this.resetFormGroup();
  }

  resetFormGroup() {
    this.signupFG.reset();
  }
  
  onOtpChange(otp) {
    this.otp = otp;
    if (String(this.otp).length == 6) {
      this.inValidPasscode = false;
    } else {
      this.inValidPasscode = true;
    }
  }

  submitSignupForm(valid, value) {
    this.serverError = null;
    if (valid) {
      //console.log(value);
      this.loading = true;

      this.email = value.email;

      this.authService.signup(value).subscribe(
        (response: any) => {
          this.loading = false;
          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');
            this.resetFormGroup();
            this.showEmailBox = false;
            this.showPasscodeBox = true;
          }
          else {
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
        });
    }
  }

  submitOTP() {
    this.serverError = null;

    if (String(this.otp).length < 6) {
      this.toastr.error('Please enter valid passcode.', 'Error');
      return;
    }

    let value = {
      email: this.email,
      passcode: this.otp
    }

    this.loading = true;

    this.authService.verifyPasscode(value).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          //this.toastr.success(response.message, 'Success');
          this.resetFormGroup();

          if (localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN)) {
            localStorage.removeItem(LocalstorageKeyEnum.AUTH_TOKEN);
          }

          if (localStorage.getItem(LocalstorageKeyEnum.USER)) {
            localStorage.removeItem(LocalstorageKeyEnum.USER);
          }

          localStorage.setItem(LocalstorageKeyEnum.AUTH_TOKEN, response.data.access_token);
          localStorage.setItem(LocalstorageKeyEnum.USER, JSON.stringify(response.data));
          localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);

          if (!response.data.full_name) {
            localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.WHATS_YOUR_NAME);
            localStorage.setItem(LocalstorageKeyEnum.PREVIOUS_URL, '');
            this.router.navigate(['/whats-your-name']);
            return;
          }

          if (response.data.role_id == RoleEnum.MODERATOR && response.data.fanspace_count < 1) {
            localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.WHAT_WE_CALL_YOUR_FANSPACE);
            this.router.navigate(['/what-we-call-your-fanspace']);
            return;
          }

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
      })
  }

}
