import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftMenuSidebarComponent } from './left-menu-sidebar.component';

describe('LeftMenuSidebarComponent', () => {
  let component: LeftMenuSidebarComponent;
  let fixture: ComponentFixture<LeftMenuSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeftMenuSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftMenuSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
