import { TestBed } from '@angular/core/testing';

import { DataShareService } from './moderator-dashboard.service';

describe('DataShareService', () => {
  let service: DataShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
