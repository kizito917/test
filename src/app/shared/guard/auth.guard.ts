import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
//import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { RoleEnum, StepEnum, LocalstorageKeyEnum } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  //canActivate(
  //  next: ActivatedRouteSnapshot,
  //  state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //  return true;
  //}

  constructor(private router: Router, private authService: AuthService) { }

  canActivate(route, state: RouterStateSnapshot) {
    
    if (this.authService.isLoggedIn()) {

      let step = localStorage.getItem(LocalstorageKeyEnum.STEP);
      
      if (state.url !== '/whats-your-name' && step === StepEnum.WHATS_YOUR_NAME) {
        this.router.navigate(['/whats-your-name']);
      } else if (state.url !== '/what-we-call-your-fanspace' && (step === StepEnum.WHAT_WE_CALL_YOUR_FANSPACE || step === StepEnum.CREATE_NEW_FANSPACE)) {
        this.router.navigate(['/what-we-call-your-fanspace']);
      } else if (state.url !== '/select-fanspace' && step === StepEnum.SELECT_FANSPACE) {
          this.router.navigate(['/select-fanspace']);
      }

      return true;
    }

    //this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });

    if (state.url === '' || state.url === '/' || state.url === '/dashboard' || state.url === '/moderator-dashboard') {
      this.router.navigate(['/login']);
    }
    else {
      this.router.navigate(['/access-denied']);
    }
    
    return false;
  }
  
}
