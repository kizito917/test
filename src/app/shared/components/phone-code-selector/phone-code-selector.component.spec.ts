import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneCodeSelectorComponent } from './phone-code-selector.component';

describe('PhoneCodeSelectorComponent', () => {
  let component: PhoneCodeSelectorComponent;
  let fixture: ComponentFixture<PhoneCodeSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhoneCodeSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneCodeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
