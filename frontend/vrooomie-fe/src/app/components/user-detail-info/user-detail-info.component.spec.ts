import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailInfoComponent } from './user-detail-info.component';

describe('UserDetailInfoComponent', () => {
  let component: UserDetailInfoComponent;
  let fixture: ComponentFixture<UserDetailInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserDetailInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDetailInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
