import { Component, OnInit, forwardRef, OnDestroy } from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-duration-selector',
  templateUrl: './duration-selector.component.html',
  styleUrls: ['./duration-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationSelectorComponent),
      multi: true
    },
    //SettingService
  ]
})
export class DurationSelectorComponent implements OnInit, ControlValueAccessor, OnDestroy {

  public selectedValue = '';

  public durations: any[] = [];
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

  ngOnInit(): void {

  	this.durations.push({ value: '30', name:'30 Mins' });
    this.durations.push({ value: '60', name:'60 Mins' });
    this.durations.push({ value: '90', name:'90 Mins' });
    this.durations.push({ value: '120',name:'120 Mins' });
  }

  public writeValue(obj: any) {
    this.selectedValue = obj;
  }

  public selectChanged($event) {
    this.propagateChange($event.target.value);
  }

  ngOnDestroy(): void { }
}
