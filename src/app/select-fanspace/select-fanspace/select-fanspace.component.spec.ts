import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFanspaceComponent } from './select-fanspace.component';

describe('SelectFanspaceComponent', () => {
  let component: SelectFanspaceComponent;
  let fixture: ComponentFixture<SelectFanspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectFanspaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFanspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
