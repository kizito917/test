import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAttendeeDashboardComponent } from './event-attendee-dashboard.component';

describe('EventAttendeeDashboardComponent', () => {
  let component: EventAttendeeDashboardComponent;
  let fixture: ComponentFixture<EventAttendeeDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventAttendeeDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventAttendeeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
