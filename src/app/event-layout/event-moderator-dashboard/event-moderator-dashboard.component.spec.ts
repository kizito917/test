import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventModeratorDashboardComponent } from './event-moderator-dashboard.component';

describe('EventModeratorDashboardComponent', () => {
  let component: EventModeratorDashboardComponent;
  let fixture: ComponentFixture<EventModeratorDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventModeratorDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventModeratorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
