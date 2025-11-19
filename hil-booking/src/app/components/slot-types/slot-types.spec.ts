import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotTypes } from './slot-types';

describe('SlotTypes', () => {
  let component: SlotTypes;
  let fixture: ComponentFixture<SlotTypes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotTypes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotTypes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
