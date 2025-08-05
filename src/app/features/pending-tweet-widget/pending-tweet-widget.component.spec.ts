import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoService } from '@ngneat/transloco';

import { PendingTweetWidgetComponent } from './pending-tweet-widget.component';

describe('PendingTweetWidgetComponent', () => {
  let component: PendingTweetWidgetComponent;
  let fixture: ComponentFixture<PendingTweetWidgetComponent>;

  const mockTranslocoService = {
    translate: (key: string) => key,
    selectTranslate: (key: string) => ({ subscribe: () => { } }),
    setActiveLang: () => { },
    getActiveLang: () => 'en'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PendingTweetWidgetComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TranslocoService, useValue: mockTranslocoService }
      ]
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
