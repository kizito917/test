import { TestBed } from '@angular/core/testing';

import { FanspaceService } from './fanspace.service';

describe('FanspaceService', () => {
  let service: FanspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FanspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
