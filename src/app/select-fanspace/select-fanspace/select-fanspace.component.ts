import { Component, OnInit } from '@angular/core';
import { UserService, LocalstorageKeyEnum, StepEnum,RoleEnum } from 'src/app/shared';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-select-fanspace',
  templateUrl: './select-fanspace.component.html',
  styleUrls: ['./select-fanspace.component.scss']
})
export class SelectFanspaceComponent implements OnInit {

  public fanspaces = [];
  public loading = false;
  public serverError: any = null;
  public genericError = "service is not available. please try again later.";

  public roles = {
    MODERATOR: RoleEnum.MODERATOR,
    ATTENDEE: RoleEnum.ATTENDEE
  };

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.getConnectedFanspaces();
  }

  ngOnInit(){
  }

  getConnectedFanspaces() {
    this.serverError = null;
    this.loading = true;
    this.userService.getConnectedFanspaces().subscribe(
      (response: any) => {
        this.loading = false;
        if (response && response.is_success) {
          this.fanspaces = response.data.connected_fanspaces;
        } else {
          this.serverError = response.message;
          this.toastr.error(this.serverError, 'Error');
        }

      }, (err: HttpErrorResponse) => {
        this.loading = false;
        if (err && err.error) {
          this.serverError = err.error.message;
        } else {
          this.serverError = this.genericError
        }
        this.toastr.error(this.serverError, 'Error');

        if (err && err.status && err.status == 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }

      });
  }

  setSelectedFanspace(fanspaceId, roleId,fanspacesName,fanspacesLogo) {
    if (fanspaceId && roleId) {
      localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ID, `${fanspaceId}`);
      localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID, `${roleId}`);
      localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_NAME, `${fanspacesName}`);
      localStorage.setItem(LocalstorageKeyEnum.SELECTED_FANSPACE_LOGO, `${fanspacesLogo}`);
      localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.NONE);

      if (roleId == RoleEnum.ATTENDEE){
        this.router.navigate(['/dashboard']);
      }
      else{
        this.router.navigate(['/moderator-dashboard']); 
      }
    }

  }

  createNewFanspace() {
    localStorage.setItem(LocalstorageKeyEnum.STEP, StepEnum.CREATE_NEW_FANSPACE);
    this.router.navigate(['/what-we-call-your-fanspace']);
  }
}
