import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendeeCartComponent } from './attendee-cart.component';

describe('AttendeeCartComponent', () => {
  let component: AttendeeCartComponent;
  let fixture: ComponentFixture<AttendeeCartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendeeCartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendeeCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
