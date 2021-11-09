import { Component, OnInit, ViewChild, ElementRef, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-carousel-url-input',
  templateUrl: './carousel-url-input.component.html',
  styleUrls: ['./carousel-url-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CarouselUrlInputComponent),
      multi: true
    }
  ]
})
export class CarouselUrlInputComponent implements OnInit, ControlValueAccessor {

  @Input('value') _value = '';
  onChange: any = () => { };
  onTouched: any = () => { };

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  @ViewChild('carousel_url_input') carousel_url_input: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  registerOnChange(fn) {
    this.onChange = fn;
  }

  writeValue(value) {
    if (value) {
      this.value = value;
    }
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

}
