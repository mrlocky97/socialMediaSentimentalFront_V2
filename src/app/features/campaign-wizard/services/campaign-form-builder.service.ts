import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CampaignFormBuilderService {
  constructor(private fb: FormBuilder) {}

  createBasicInfoForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: ['', Validators.required]
    });
  }

  createTargetingForm(): FormGroup {
    return this.fb.group({
      hashtags: this.fb.array([]),
      keywords: this.fb.array([]),
      mentions: this.fb.array([])
    });
  }

  createSettingsForm(): FormGroup {
    return this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxTweets: [1000, [Validators.required, Validators.min(100), Validators.max(10000)]],
      sentimentAnalysis: [true]
    });
  }

  createTagControl(): FormControl {
    return this.fb.control('', [Validators.required, Validators.minLength(2)]);
  }
}
