import { Component, OnInit, forwardRef, OnDestroy } from '@angular/core';
//import { SettingService } from '../../services';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-phone-code-selector',
  templateUrl: './phone-code-selector.component.html',
  styleUrls: ['./phone-code-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneCodeSelectorComponent),
      multi: true
    },
    //SettingService
  ]
})
export class PhoneCodeSelectorComponent implements OnInit, ControlValueAccessor, OnDestroy {
  public selectedValue = '';

  public codes: any[] = [];
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
  constructor() { }

  ngOnInit() {
    
    this.codes.push({ id: '1', code: '+1', country:'United States' });
    this.codes.push({ id: '44', code: '+44', country: 'United Kingdom' });
    this.codes.push({ id: '91', code: '+91', country: 'India' });
    this.codes.push({ id: '507', code: '+507', country: 'Panama' });
  }

  public writeValue(obj: any) {
    this.selectedValue = obj;
  }

  public selectChanged($event) {
    this.propagateChange($event.target.value);
  }

  ngOnDestroy(): void { }
}
