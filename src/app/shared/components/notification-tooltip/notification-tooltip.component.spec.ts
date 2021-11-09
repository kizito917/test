import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationTooltipComponent } from './notification-tooltip.component';

describe('NotificationTooltipComponent', () => {
  let component: NotificationTooltipComponent;
  let fixture: ComponentFixture<NotificationTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
