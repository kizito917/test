import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatWeCallYourFanspaceComponent } from './what-we-call-your-fanspace.component';

describe('WhatWeCallYourFanspaceComponent', () => {
  let component: WhatWeCallYourFanspaceComponent;
  let fixture: ComponentFixture<WhatWeCallYourFanspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhatWeCallYourFanspaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhatWeCallYourFanspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
