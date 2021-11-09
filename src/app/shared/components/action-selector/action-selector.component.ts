import { Component, OnInit, forwardRef, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
//import { ActionService } from '../../services';

@Component({
  selector: 'app-action-selector',
  templateUrl: './action-selector.component.html',
  styleUrls: ['./action-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ActionSelectorComponent),
      multi: true
    },
    //ActionService
  ]
})
export class ActionSelectorComponent implements OnInit, ControlValueAccessor,OnDestroy {
  public selectedValue = '';

  public actions: any[] = [];
  private propagateChange = (_: any) => { };

  private propagateTouched = (_: any) => { };
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    throw new Error('Method not implemented.');
  }
  constructor(
  //  private actionService: ActionService
  ) { }

  ngOnInit() {
    //this.actionService.getActionsList().subscribe(
    //  (response: any) => {

    //    let action_list = [];

    //    if (response && response.status) {
    //      action_list = response.data;
    //    }

    //    this.actions = action_list;

    //});
  }

  public writeValue(obj: any) {
    this.selectedValue = obj;
  }

  public selectChanged($event) {
    this.propagateChange($event.target.value);
  }

  ngOnDestroy(): void { }

}
