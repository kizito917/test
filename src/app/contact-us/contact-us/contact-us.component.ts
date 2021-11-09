import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { emailValidator, fieldIsRequired, InquiryService, onlyTextAndSpace, AuthService } from 'src/app/shared';
import { ControlContainerSubmissionService } from '../../shared/components/control-container/control-container-submission.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {

  public contactusFG: FormGroup;
  accessToken: any;
  httpOptions: any;
  loading = false;
  contactUs;
  serverError: any = null;
  genericError = "service is not available. please try again later."

  constructor(private inquiryService: InquiryService,
    private FB: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private controlContainerSubmissionService: ControlContainerSubmissionService,
  ) {

    if (authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.contactusFG = this.FB.group({
      email: ['', [fieldIsRequired('Email'), emailValidator()]],
      full_name: ['', [fieldIsRequired('Name'), onlyTextAndSpace('Name')]],
      subject: ['', [fieldIsRequired('Subject')]],
      message: ['', [fieldIsRequired('Message')]],
    });
  }

  submitContactUsForm(valid, value) {
    this.serverError = null;
    if (valid) {
      this.loading = true;

      this.inquiryService.addInquiry(value).subscribe(
        (response: any) => {
          this.loading = false;

          if (response && response.is_success) {
            //this.toastr.success(response.message, 'Success');
            this.contactusFG.reset();
            this.controlContainerSubmissionService.submitted.next(false);
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
}
