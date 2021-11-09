import { Directive } from '@angular/core';
import { ControlContainerSubmissionService } from './control-container-submission.service';

@Directive({
  selector: '[formGroup]',
  host: { '(submit)': 'onSubmit($event)', '(reset)': 'onReset()' }
})
export class FormSubmissionListenerDirective {

  constructor(private controlContainerSubmissionService: ControlContainerSubmissionService) { }

  // @HostListener('submit')
  onSubmit($event: Event): void {
    //console.log('HostListener called');
    this.controlContainerSubmissionService.submitted.next(true);
  }

  onReset(): void {
    this.controlContainerSubmissionService.submitted.next(false);
  }
}
