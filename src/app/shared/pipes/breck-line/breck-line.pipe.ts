import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'breckLine'
})
export class BreckLinePipe implements PipeTransform {

  transform(value: string): any {
    if (value) {
      return value.replace(/\n/g, '<br/>');;
    }
    else {
      return null;
    }
  }
  
}
