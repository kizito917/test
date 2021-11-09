import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, fieldIsRequired, emailValidator, GlobalVariable, UserService, RoleEnum, StepEnum, LocalstorageKeyEnum} from '../../shared';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { ControlContainerSubmissionService } from 'src/app/shared/components/control-container/control-container-submission.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public loginFG: FormGroup;
  public loading = false;
  public serverError: any = null;
  public showEmailBox = false;
  public showPasscodeBox = false;
  public showLoginOptions = true;
  public email = '';
  public genericError = "service is not available. please try again later.";
  public inValidPasscode = true;

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
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private controlContainerSubmissionService: ControlContainerSubmissionService
  ) {
    if (authService.isLoggedIn()) {
      this.router.navigate(['/']);
    } else {
      localStorage.clear();
    }

    this.loginFG = this.FB.group({
      email: ['', [fieldIsRequired('Email'), emailValidator()]]
    });
  }
  
  ngOnInit() {
    this.resetFormGroup();
  }

  resetFormGroup() {
    this.controlContainerSubmissionService.submitted.next(false);
    this.loginFG.reset();
  }

  createFanspace() {
    this.router.navigate(['/signup']);
  }

  login() {
    this.resetFormGroup();
    this.showLoginOptions = false;
    this.showEmailBox = true;
    this.showPasscodeBox = false;
  }

  back() {
    this.resetFormGroup();
    this.showLoginOptions = true;
    this.showEmailBox = false;
    this.showPasscodeBox = false;
  }

  onOtpChange(otp) {
    this.otp = otp;
    if (String(this.otp).length == 6) {
      this.inValidPasscode = false;
    } else {
      this.inValidPasscode = true;
    }
  }

  submitLoginForm(valid, value) {
    this.serverError = null;
    if (valid) {
      this.loading = true;

      this.email = value.email;

      this.authService.signin(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');
            this.resetFormGroup();
            this.showEmailBox = false;
            this.showPasscodeBox = true;
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

          localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.SELECT_FANSPACE);
          this.router.navigate(['/select-fanspace']);

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
