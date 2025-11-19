import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserApproval } from './user-approval';

describe('UserApproval', () => {
  let component: UserApproval;
  let fixture: ComponentFixture<UserApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
