import { Component, OnInit, ViewChild, ElementRef, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-tagline-input',
  templateUrl: './tagline-input.component.html',
  styleUrls: ['./tagline-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TaglineInputComponent),
      multi: true
    }
  ]
})
export class TaglineInputComponent implements OnInit, ControlValueAccessor {

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

  @ViewChild('tagline_input') tagline_input: ElementRef;
  isEmojiMartOpen: boolean = false;

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

  toggleEmojiMart() {
    this.isEmojiMartOpen = !this.isEmojiMartOpen;
  }

  emojiSelected(event) {
    const emoji: string = (event.emoji as any).native;
    const input = this.tagline_input.nativeElement;
    input.focus();
    if (document.execCommand) {
      let event = new Event('input');
      document.execCommand('insertText', false, emoji);
      return;
    }
    const [start, end] = [input.selectionStart, input.selectionEnd];
    input.setRangeText(emoji, start, end, 'end');

  }

}
