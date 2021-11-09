import { TestBed } from '@angular/core/testing';

import { LeaveComponentGuard } from './leave-component.guard';

describe('LeaveComponentGuard', () => {
  let guard: LeaveComponentGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(LeaveComponentGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
