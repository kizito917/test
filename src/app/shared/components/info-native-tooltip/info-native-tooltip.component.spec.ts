import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoNativeTooltipComponent } from './info-native-tooltip.component';

describe('InfoNativeTooltipComponent', () => {
  let component: InfoNativeTooltipComponent;
  let fixture: ComponentFixture<InfoNativeTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoNativeTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoNativeTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
