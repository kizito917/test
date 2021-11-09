import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { InquiryService } from 'src/app/shared';
import { environment } from "src/environments/environment";

@Component({
	selector: 'app-feedback',
	templateUrl: './feedback.component.html',
	styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {
	subscriptionFG: FormGroup;

	formSubmitAttempt = false
	loading = false;
	serverError: any = null;
	genericError = "service is not available. please try again later."

	constructor(
		private FB: FormBuilder,
		private toastr: ToastrService,
		private inquiryService: InquiryService
	) { }

	ngOnInit(): void {
		this.subscriptionFG = this.FB.group({
			email: ['', [Validators.required, Validators.email]]
		});
	}

	submitSubscription() {
		this.formSubmitAttempt = true;
		this.serverError = null;
		if (this.subscriptionFG.valid) {
			this.loading = true;

			this.inquiryService.addSubscription(this.subscriptionFG.value).subscribe(
				(response: any) => {
					this.loading = false;
					this.formSubmitAttempt = false;

					if (response && response.is_success) {
						//this.toastr.success(response.message, 'Success');
						this.subscriptionFG.reset();
					}
					else {
						this.serverError = response.message;
						this.toastr.error(this.serverError, 'Error');
					}
				},
				(err: HttpErrorResponse) => {
					this.loading = false;
					this.formSubmitAttempt = false;
					this.serverError = this.genericError;
					if (err && err.error) {
						this.serverError = err.error.message;
					}
					this.toastr.error(this.serverError, 'Error');
				});
		}
	}

	redirectToBillionsLive(page) {
		if (page === 'contact') {
			window.location.href = `${environment.billionsLiveUrl}contact`;
		}
		else {
			window.location.href = `${environment.billionsLiveUrl}legal`;
		}
	}
}
