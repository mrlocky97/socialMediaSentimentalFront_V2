import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTweetWidgetComponent } from './pending-tweet-widget.component';

describe('PendingTweetWidgetComponent', () => {
  let component: PendingTweetWidgetComponent;
  let fixture: ComponentFixture<PendingTweetWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingTweetWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTweetWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
