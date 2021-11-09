import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { emailValidator, fieldIsRequired, AuthService, RoleEnum, UserService, getUserFromLocalStorage, setUserIntoLocalStorage, StepEnum, LocalstorageKeyEnum } from 'src/app/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ParticipantInviteService } from 'src/app/shared/services/participant-invite/participant-invite.service';

@Component({
  selector: 'app-participant-invite',
  templateUrl: './participant-invite.component.html',
  styleUrls: ['./participant-invite.component.scss'],
  providers: [NgbModalConfig, NgbModal]
})
export class ParticipantInviteComponent implements OnInit {

  public participantJoinFanspaceFB: FormGroup;
  public loading = false;
  page_loader = true;
  public serverError: any = null;
  public email = '';
  public inValidPasscode = true;
  public genericError = "service is not available. please try again later.";
  public event_code;
  public eventId;
  public fanspaceId;
  public fanspaceData;
  public showEmailBox = true;
  public showPasscodeBox = false;
  public fanspaceName;
  public fanspaceLogo;
  public fanspaceRoleId;

  otp: string;
  showOtpComponent = true;
  @ViewChild('ngOtpInput', { static: false }) ngOtpInput: any;
  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: ''
  };

  constructor(
    private FB: FormBuilder,
    private route: ActivatedRoute,
    private participantService: ParticipantInviteService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.route.params.subscribe(params => {
      if (params && params.event_code) {
        this.event_code = params.event_code;

        if (authService.isLoggedIn()) {
          this.joinFanspace();
        }
        else {
          this.verifyEventInviteLink();
        }
      } else {
        this.router.navigate(['not-found']);
      }
    })
  }

  joinFanspace() {
    this.serverError = null;
    this.page_loader = true;
    let body = {
      event_code: this.event_code
    }
    this.participantService.joinFanspace(body).subscribe(
      (response: any) => {
        
        if (response && response.is_success) {
          //this.toastr.success(response.message, 'Success');
          // Save fanspace data in local storage and redirect to dashboard
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID, response.data.fanspace.fanspaceId);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID, `${response.data.fanspace.roleId}`);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME, response.data.fanspace.fanspaceName);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, response.data.fanspace.logo);

          localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);
          //this.router.navigate(['/dashboard']);
          this.router.navigate(['/event/join', this.event_code]);

        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, 'Error');
        }

        this.page_loader = false;

      }, (err: HttpErrorResponse) => {
        this.page_loader = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError
        }
        this.toastr.error(this.serverError, 'Error');

        if (err && err.status && err.status == 401) {
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['not-found']);
        }

        //this.router.navigate(['not-found']);
      });
  }

  verifyEventInviteLink() {
    this.serverError = null;
    this.page_loader = true;
    let body = {
      event_code: this.event_code
    }
    this.participantService.verifyEventInviteLink(body).subscribe(
      (response: any) => {
        
        if (response && response.is_success) {
          //this.toastr.success(response.message, 'Success');

          this.eventId = response.data.event.eventId;
          this.fanspaceId = response.data.fanspace.fanspaceId;
          this.fanspaceName = response.data.fanspace.fanspaceName;
          this.fanspaceLogo = response.data.fanspace.logo;

          this.fanspaceData = response.data.fanspace;

        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, 'Error');
        }

        this.page_loader = false;

      }, (err: HttpErrorResponse) => {
        this.page_loader = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError
        }
        this.toastr.error(this.serverError, 'Error');

        if (err && err.status && err.status == 401) {
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['not-found']);
        }

        //this.router.navigate(['not-found']);
      });
  }
  
  onOtpChange(otp) {
    this.otp = otp;
    if (String(this.otp).length == 6) {
      this.inValidPasscode = false;
    } else {
      this.inValidPasscode = true;
    }
  }

  ngOnInit() {

    this.participantJoinFanspaceFB = this.FB.group({
      email: ['', [fieldIsRequired('Email'), emailValidator()]]
    });

    this.resetFormGroup();
  }

  resetFormGroup() {
    this.participantJoinFanspaceFB.reset();
  }

  submitParticipantJoinFanspaceForm(valid, value) {
    this.serverError = null;
    if (valid) {

      this.loading = true;

      this.email = value.email;

      let body = {
        event_code: this.event_code,
        email: value.email
      }

      this.participantService.participantJoinFanspace(body).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');

            this.fanspaceRoleId = response.data.fanspaceRoleId;

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

          this.showPasscodeBox = false;

          if (localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN)) {
            localStorage.removeItem(LocalstorageKeyEnum.AUTH_TOKEN);
          }

          if (localStorage.getItem(LocalstorageKeyEnum.USER)) {
            localStorage.removeItem(LocalstorageKeyEnum.USER);
          }

          localStorage.setItem(LocalstorageKeyEnum.AUTH_TOKEN, response.data.access_token);
          localStorage.setItem(LocalstorageKeyEnum.USER, JSON.stringify(response.data));

          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID, `${this.fanspaceId}`);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID, `${this.fanspaceRoleId}`);
          localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME, `${this.fanspaceName}`);
          localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, `${this.fanspaceLogo}`);

          if (!response.data.full_name) {
            localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.WHATS_YOUR_NAME);
            localStorage.setItem(LocalstorageKeyEnum.PREVIOUS_URL, `/event/join/${this.event_code}`);
            this.router.navigate(['/whats-your-name']);
            return;
          }
          
          //this.router.navigate(['/dashboard']);
          if (this.fanspaceRoleId == RoleEnum.MODERATOR) {
            this.router.navigate(['/moderator-dashboard']);
          }
          else {
            this.router.navigate(['/event/join', this.event_code]);
          }

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
