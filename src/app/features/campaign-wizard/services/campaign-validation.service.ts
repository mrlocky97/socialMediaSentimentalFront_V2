import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CampaignValidationService {

  validateBasicInfo(form: FormGroup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!form.get('name')?.value) {
      errors.push('Campaign name is required');
    } else if (form.get('name')?.value.length < 3) {
      errors.push('Campaign name must be at least 3 characters');
    }

    if (!form.get('description')?.value) {
      errors.push('Campaign description is required');
    } else if (form.get('description')?.value.length < 10) {
      errors.push('Campaign description must be at least 10 characters');
    }

    if (!form.get('type')?.value) {
      errors.push('Campaign type is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateTargeting(form: FormGroup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const hashtags = form.get('hashtags')?.value || [];
    const keywords = form.get('keywords')?.value || [];
    const mentions = form.get('mentions')?.value || [];

    if (hashtags.length === 0 && keywords.length === 0 && mentions.length === 0) {
      errors.push('At least one targeting method (hashtag, keyword, or mention) is required');
    }

    // Validate hashtags format
    hashtags.forEach((hashtag: string, index: number) => {
      if (hashtag && !hashtag.startsWith('#')) {
        warnings.push(`Hashtag ${index + 1} should start with #`);
      }
    });

    // Validate mentions format
    mentions.forEach((mention: string, index: number) => {
      if (mention && !mention.startsWith('@')) {
        warnings.push(`Mention ${index + 1} should start with @`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateSettings(form: FormGroup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;
    const maxTweets = form.get('maxTweets')?.value;

    if (!startDate) {
      errors.push('Start date is required');
    }

    if (!endDate) {
      errors.push('End date is required');
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start < now) {
        warnings.push('Start date is in the past');
      }

      if (end <= start) {
        errors.push('End date must be after start date');
      }

      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        warnings.push('Campaign duration is longer than 90 days');
      }
    }

    if (!maxTweets || maxTweets < 100) {
      errors.push('Maximum tweets must be at least 100');
    } else if (maxTweets > 10000) {
      warnings.push('High tweet limit may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateComplete(basicForm: FormGroup, targetingForm: FormGroup, settingsForm: FormGroup): ValidationResult {
    const basicValidation = this.validateBasicInfo(basicForm);
    const targetingValidation = this.validateTargeting(targetingForm);
    const settingsValidation = this.validateSettings(settingsForm);

    return {
      isValid: basicValidation.isValid && targetingValidation.isValid && settingsValidation.isValid,
      errors: [
        ...basicValidation.errors,
        ...targetingValidation.errors,
        ...settingsValidation.errors
      ],
      warnings: [
        ...basicValidation.warnings,
        ...targetingValidation.warnings,
        ...settingsValidation.warnings
      ]
    };
  }
}
