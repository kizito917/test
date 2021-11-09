import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaglineInputComponent } from './tagline-input.component';

describe('TaglineInputComponent', () => {
  let component: TaglineInputComponent;
  let fixture: ComponentFixture<TaglineInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaglineInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaglineInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
