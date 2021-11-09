import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlContainerSubmissionService {
  public submitted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  constructor() { }
}
