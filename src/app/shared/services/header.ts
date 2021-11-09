
import { HttpHeaders } from '@angular/common/http';
import { LocalstorageKeyEnum } from '../enums';

export function getHttpHeaderOptions() {
  const httpOptions = {
    headers: new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN)}`
    })
  };
  return httpOptions;
}
