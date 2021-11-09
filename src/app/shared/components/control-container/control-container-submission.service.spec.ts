import { TestBed } from '@angular/core/testing';

import { ControlContainerSubmissionService } from './control-container-submission.service';

describe('ControlContainerSubmissionService', () => {
  let service: ControlContainerSubmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlContainerSubmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
