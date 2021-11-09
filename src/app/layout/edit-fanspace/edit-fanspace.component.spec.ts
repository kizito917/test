import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFanspaceComponent } from './edit-fanspace.component';

describe('EditFanspaceComponent', () => {
  let component: EditFanspaceComponent;
  let fixture: ComponentFixture<EditFanspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditFanspaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFanspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
