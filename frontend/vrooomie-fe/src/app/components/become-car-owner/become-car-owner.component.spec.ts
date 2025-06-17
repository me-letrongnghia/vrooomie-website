import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BecomeCarOwnerComponent } from './become-car-owner.component';

describe('BecomeCarOwnerComponent', () => {
  let component: BecomeCarOwnerComponent;
  let fixture: ComponentFixture<BecomeCarOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BecomeCarOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BecomeCarOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
