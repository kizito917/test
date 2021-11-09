import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { LeaveComponentInterface } from '../interfaces';


@Injectable({
  providedIn: 'root'
})
export class LeaveComponentGuard implements CanDeactivate<LeaveComponentInterface> {
  canDeactivate(
    component: LeaveComponentInterface,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
  {
    console.log('canDeactivate from LeaveComponentGuard!!!');
    if (component.canLeaveComponent) {
      return component.canLeaveComponent();
    }

    return true;
  }
  
}
