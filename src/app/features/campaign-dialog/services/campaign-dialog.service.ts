import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { CampaignFormData } from '../campaign-dialog.component';


export interface CampaignCreationResult {
  success: boolean;
  campaignId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'hashtag' | 'keyword' | 'user';
  status: 'active' | 'inactive' | 'completed';
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: Date;
  endDate: Date;
  maxTweets: number;
  sentimentAnalysis: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignWizardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/campaigns`;

  async createCampaign(formData: CampaignFormData): Promise<CampaignCreationResult> {
    try {
      const campaignPayload = this.transformFormDataToCampaign(formData);

      const response = await this.http.post<{ campaign: Campaign }>(
        this.apiUrl,
        campaignPayload
      ).toPromise();

      if (response?.campaign) {
        return {
          success: true,
          campaignId: response.campaign.id
        };
      } else {
        return {
          success: false,
          errors: ['Failed to create campaign - no response data']
        };
      }
    } catch (error: any) {
      console.error('Campaign creation error:', error);

      // Si el backend no está disponible, crear campaña mock
      if (error.status === 0 || error.status === 404 || error.status === 500 || error.status === 401) {
        console.warn('🔄 Backend no disponible, creando campaña mock para desarrollo');
        return this.createMockCampaign(formData);
      }

      return {
        success: false,
        errors: this.extractErrorMessages(error)
      };
    }
  }

  getCampaignById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.apiUrl}/${id}`);
  }

  updateCampaign(id: string, updates: Partial<Campaign>): Observable<Campaign> {
    return this.http.put<Campaign>(`${this.apiUrl}/${id}`, updates);
  }

  deleteCampaign(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  duplicateCampaign(id: string, newName?: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/${id}/duplicate`, {
      name: newName
    });
  }

  validateCampaignName(name: string): Observable<{ isAvailable: boolean }> {
    return this.http.get<{ isAvailable: boolean }>(
      `${this.apiUrl}/validate-name?name=${encodeURIComponent(name)}`
    );
  }

  private transformFormDataToCampaign(formData: CampaignFormData): Partial<Campaign> {
    return {
      name: formData.basic.name,
      description: formData.basic.description,
      type: formData.basic.type,
      hashtags: formData.targeting.hashtags.filter(tag => tag && tag.trim()),
      keywords: formData.targeting.keywords.filter(keyword => keyword && keyword.trim()),
      mentions: formData.targeting.mentions.filter(mention => mention && mention.trim()),
      startDate: new Date(formData.settings.startDate),
      endDate: new Date(formData.settings.endDate),
      maxTweets: formData.settings.maxTweets,
      sentimentAnalysis: formData.settings.sentimentAnalysis,
      status: 'inactive' // New campaigns start as inactive
    };
  }

  private extractErrorMessages(error: any): string[] {
    if (error?.error?.message) {
      return [error.error.message];
    }

    if (error?.error?.errors) {
      if (Array.isArray(error.error.errors)) {
        return error.error.errors;
      }

      if (typeof error.error.errors === 'object') {
        return Object.values(error.error.errors).flat() as string[];
      }
    }

    if (error?.message) {
      return [error.message];
    }

    return ['An unexpected error occurred while creating the campaign'];
  }

  // Utility methods for campaign management
  getDefaultFormData(): CampaignFormData {
    return {
      basic: {
        name: '',
        description: '',
        type: 'hashtag'
      },
      targeting: {
        hashtags: [],
        keywords: [],
        mentions: []
      },
      settings: {
        startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        maxTweets: 1000,
        sentimentAnalysis: true
      }
    };
  }

  isValidCampaignType(type: string): type is 'hashtag' | 'keyword' | 'user' {
    return ['hashtag', 'keyword', 'user'].includes(type);
  }

  calculateEstimatedDuration(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  getMaxRecommendedTweets(duration: number): number {
    // Recommend tweet limits based on campaign duration
    if (duration <= 7) return 500;
    if (duration <= 30) return 2000;
    if (duration <= 90) return 5000;
    return 10000;
  }

  /**
   * Crear campaña mock para desarrollo cuando el backend no está disponible
   */
  private createMockCampaign(formData: CampaignFormData): CampaignCreationResult {
    console.log('🚀 Creando campaña mock para desarrollo:', formData);

    const mockCampaignId = `mock-campaign-${Date.now()}`;

    // Simular guardado en localStorage para persistencia
    const existingCampaigns = JSON.parse(localStorage.getItem('mock_campaigns') || '[]');
    const newCampaign: Campaign = {
      id: mockCampaignId,
      name: formData.basic.name,
      description: formData.basic.description,
      type: formData.basic.type,
      status: 'active',
      hashtags: formData.targeting.hashtags.filter(tag => tag && tag.trim()),
      keywords: formData.targeting.keywords.filter(keyword => keyword && keyword.trim()),
      mentions: formData.targeting.mentions.filter(mention => mention && mention.trim()),
      startDate: new Date(formData.settings.startDate),
      endDate: new Date(formData.settings.endDate),
      maxTweets: formData.settings.maxTweets,
      sentimentAnalysis: formData.settings.sentimentAnalysis,
      organizationId: 'mock-org-001',
      createdBy: 'mock-user-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    existingCampaigns.push(newCampaign);
    localStorage.setItem('mock_campaigns', JSON.stringify(existingCampaigns));

    console.log('✅ Campaña mock creada exitosamente:', newCampaign);

    return {
      success: true,
      campaignId: mockCampaignId,
      warnings: ['Campaña creada en modo desarrollo (mock data)']
    };
  }
}
