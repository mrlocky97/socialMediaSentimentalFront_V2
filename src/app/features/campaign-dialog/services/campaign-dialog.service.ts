import { Injectable, inject } from '@angular/core';
import { Observable, catchError, firstValueFrom, from, map, of, tap } from 'rxjs';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import { CampaignRequest } from '../interfaces/campaign-dialog.interface';
import { UpdateCampaignRequest } from '../../../core/services/campaign.service';

export interface CampaignOperationResult {
  success: boolean;
  campaign?: Campaign;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignDialogService {
  private readonly campaignFacade = inject(CampaignFacade);

  /**
   * Crear una nueva campaña usando el estado global NgRx
   */
  createCampaign(campaignRequest: CampaignRequest): Observable<CampaignOperationResult> {
    return this.campaignFacade.createCampaign(campaignRequest).pipe(
      map(action => {
        if ('campaign' in action) {
          // Éxito
          return {
            success: true,
            campaign: action.campaign
          };
        } else {
          // Error
          return {
            success: false,
            error: action.error?.message || 'Error al crear la campaña'
          };
        }
      }),
      catchError(error => {
        console.error('Error al crear campaña:', error);
        return of({
          success: false,
          error: error.message || 'Error inesperado al crear la campaña'
        });
      })
    );
  }

  /**
   * Obtener una campaña por su ID
   */
  getCampaignById(id: string): Observable<Campaign | null> {
    return this.campaignFacade.getCampaignById(id);
  }

  /**
   * Actualizar una campaña existente
   */
  updateCampaign(id: string, updates: Partial<Campaign> | CampaignRequest): Observable<CampaignOperationResult> {
    // Asegurarse de que los tipos de fecha sean strings si es necesario
    const processedUpdates = {
      id,
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.hashtags && { hashtags: updates.hashtags }),
      ...(updates.keywords && { keywords: updates.keywords }),
      ...(updates.mentions && { mentions: updates.mentions }),
      ...(updates.endDate && { 
        endDate: typeof updates.endDate === 'string' 
          ? updates.endDate 
          : updates.endDate instanceof Date 
            ? updates.endDate.toISOString() 
            : new Date(updates.endDate).toISOString() 
      }),
      ...(updates.maxTweets && { maxTweets: updates.maxTweets }),
      ...(updates.sentimentAnalysis !== undefined && { sentimentAnalysis: updates.sentimentAnalysis })
    };

    return this.campaignFacade.updateCampaign(processedUpdates).pipe(
      map(action => {
        if (action.type === '[Campaign] Update Campaign Success') {
          return {
            success: true,
            campaign: action.campaign
          };
        } else {
          return {
            success: false,
            error: action.error?.message || 'Error al actualizar la campaña'
          };
        }
      }),
      catchError(error => {
        console.error('Error al actualizar campaña:', error);
        return of({
          success: false,
          error: error.message || 'Error inesperado al actualizar la campaña'
        });
      })
    );
  }

  /**
   * Eliminar una campaña
   */
  deleteCampaign(id: string): Observable<CampaignOperationResult> {
    return this.campaignFacade.deleteCampaign(id).pipe(
      map(action => {
        if (action.type === '[Campaign] Delete Campaign Success') {
          return {
            success: true
          };
        } else {
          return {
            success: false,
            error: action.error?.message || 'Error al eliminar la campaña'
          };
        }
      }),
      catchError(error => {
        console.error('Error al eliminar campaña:', error);
        return of({
          success: false,
          error: error.message || 'Error inesperado al eliminar la campaña'
        });
      })
    );
  }

  /**
   * Iniciar una campaña
   */
  startCampaign(id: string): Observable<any> {
    return this.campaignFacade.startCampaign(id);
  }

  /**
   * Detener una campaña
   */
  stopCampaign(id: string): Observable<any> {
    return this.campaignFacade.stopCampaign(id);
  }

  /**
   * Cargar todas las campañas
   */
  loadCampaigns(): void {
    this.campaignFacade.loadCampaigns();
  }

  /**
   * Obtener todas las campañas como Observable
   */
  get campaigns$(): Observable<Campaign[]> {
    return this.campaignFacade.campaigns$;
  }

  /**
   * Obtener estado de carga como Observable
   */
  get loading$(): Observable<boolean> {
    return this.campaignFacade.loading$;
  }

  /**
   * Obtener errores como Observable
   */
  get error$(): Observable<string | null> {
    return this.campaignFacade.error$;
  }

  /**
   * Utilitarios para validaciones
   */
  isValidCampaignType(type: string): boolean {
    return ['hashtag', 'keyword', 'user', 'mention', 'custom'].includes(type);
  }

  calculateEstimatedDuration(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  getMaxRecommendedTweets(duration: number): number {
    // Recomendar límites de tweets basados en la duración de la campaña
    if (duration <= 7) return 500;
    if (duration <= 30) return 2000;
    if (duration <= 90) return 5000;
    return 10000;
  }
}
