import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstLetter'
})
export class FirstLetterPipe implements PipeTransform {

 transform(value: string): string {
   if (!value) { return value; }
   value = value.trim();
   return value.charAt(0);
 }

}
