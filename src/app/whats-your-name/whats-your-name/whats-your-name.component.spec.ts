import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsYourNameComponent } from './whats-your-name.component';

describe('WhatsYourNameComponent', () => {
  let component: WhatsYourNameComponent;
  let fixture: ComponentFixture<WhatsYourNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhatsYourNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhatsYourNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
