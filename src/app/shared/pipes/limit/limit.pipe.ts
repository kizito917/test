import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limit'
})
export class LimitPipe implements PipeTransform {

  transform(value: string, limit: number = 50): any {
    if (value && value.length > limit) return value.substring(0, limit).concat('...');
    return value;
  }

}
