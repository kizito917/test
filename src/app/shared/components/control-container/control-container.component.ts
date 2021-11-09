import {
  Component, OnInit, OnChanges, AfterContentInit, 
  ContentChildren,
  Input,
  QueryList,
  SimpleChanges
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  state,
  group,
  animate
} from '@angular/animations';
import { ControlContainer, FormControlName } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ValidationService } from '../../validators/validation.service';
import { ControlContainerSubmissionService } from './control-container-submission.service';

@Component({
  selector: 'app-control-container',
  templateUrl: './control-container.component.html',
  styleUrls: ['./control-container.component.scss']
})
export class ControlContainerComponent implements OnInit, OnChanges, AfterContentInit {

  @ContentChildren(FormControlName) Controls: QueryList<FormControlName>;

  public errorMessages = [];

  @Input('isSelect') public isSelect = false;
  @Input('isRequired') public isRequired = false;
  @Input('label') label: string;

  constructor(
    private validationService: ValidationService,
    public controlContainer: ControlContainer,
    private controlContainerSubmissionService: ControlContainerSubmissionService
  ) {
    //console.log('ControlContainerComponent called');
  }

  private getErrorMessages(errors) {
    return Object.keys(errors).map(propertyName => {
      return this.validationService.getValidatorErrorMessage(
        propertyName,
        errors[propertyName]
      );
    });
  }

  ngOnInit() {
  }

  ngAfterContentInit(): void {
    this.Controls.map(control => {

      combineLatest(
        this.controlContainerSubmissionService.submitted,
        control.statusChanges.pipe(startWith(null))
      ).subscribe(value => {

        const [submitted, status] = value;

        this.errorMessages =
          (submitted === true || (control.dirty && status === 'INVALID')) &&
            control.errors
            ? this.getErrorMessages(control.errors)
            : [];

        //console.log('this.errorMessages =>.', this.errorMessages);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    
  }
}
