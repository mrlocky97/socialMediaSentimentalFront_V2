/**
 * Campaign Facade - NgRx implementation
 * Provides a simplified interface to the NgRx store for campaign operations
 */
import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, map, take, tap, of } from 'rxjs';
import { CampaignRequest } from '../../../features/campaign-dialog/interfaces/campaign-dialog.interface';
import {
  CampaignFilter,
  CampaignSortOptions,
  UpdateCampaignRequest
} from '../../services/campaign.service';
import { Campaign } from '../../state/app.state';
import * as CampaignActions from '../actions/campaign.actions';
import * as CampaignSelectors from '../selectors/campaign.selectors';

@Injectable({
  providedIn: 'root',
})
export class CampaignFacade {
  // Selectores de NgRx
  readonly campaigns$: Observable<Campaign[]>;
  readonly loading$: Observable<boolean>;
  readonly error$: Observable<string | null>;
  readonly selectedCampaign$: Observable<Campaign | null>;
  readonly activeCampaigns$: Observable<Campaign[]>;
  readonly campaignCount$: Observable<number>;
  readonly activeCampaignCount$: Observable<number>;

  constructor(
    private store: Store,
    private actions$: Actions
  ) {
    // Inicialización de selectores
    this.campaigns$ = this.store.select(CampaignSelectors.selectAllCampaigns);
    this.loading$ = this.store.select(CampaignSelectors.selectCampaignsLoading);
    this.error$ = this.store.select(CampaignSelectors.selectCampaignsError);
    this.selectedCampaign$ = this.store.select(CampaignSelectors.selectSelectedCampaign);
    this.activeCampaigns$ = this.store.select(CampaignSelectors.selectActiveCampaigns);
    this.campaignCount$ = this.store.select(CampaignSelectors.selectCampaignCount);
    this.activeCampaignCount$ = this.store.select(CampaignSelectors.selectActiveCampaignCount);
  }

  /**
   * Selecciona una campaña específica y la almacena en el store
   */
  selectCampaign(campaignId: string): Observable<Campaign | null> {
    return this.store.select(CampaignSelectors.selectCampaignById(campaignId));
  }

  /**
   * Carga campañas desde la API
   */
  loadCampaigns(
    filter: CampaignFilter = {},
    page: number = 1,
    pageSize: number = 10,
    sort?: CampaignSortOptions
  ): void {
    this.store.dispatch(
      CampaignActions.loadCampaigns({ filter, page, pageSize, sort })
    );
  }

  /**
   * Despacha la acción para crear una campaña.
   * Devuelve un observable para que el componente pueda reaccionar al éxito o error.
   */
  createCampaign(campaign: CampaignRequest): Observable<any> {
    this.store.dispatch(CampaignActions.createCampaign({ campaign }));

    // Devuelve un observable que se completa cuando la acción de éxito o fallo es despachada
    return this.actions$.pipe(
      ofType(CampaignActions.createCampaignSuccess, CampaignActions.createCampaignFailure),
      take(1) // Solo nos interesa la primera respuesta
    );
  }

  /**
   * Actualiza una campaña existente
   */
  updateCampaign(updateData: UpdateCampaignRequest): Observable<any> {
    const { id, ...data } = updateData;

    // Convertimos UpdateCampaignRequest a Partial<Campaign>
    const campaignPayload: Partial<Campaign> = {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.hashtags && { hashtags: data.hashtags }),
      ...(data.keywords && { keywords: data.keywords }),
      ...(data.mentions && { mentions: data.mentions }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.maxTweets && { maxTweets: data.maxTweets }),
      ...(data.sentimentAnalysis !== undefined && { sentimentAnalysis: data.sentimentAnalysis }),
    };

    this.store.dispatch(
      CampaignActions.updateCampaign({ id, campaign: campaignPayload })
    );

    return this.actions$.pipe(
      ofType(CampaignActions.updateCampaignSuccess, CampaignActions.updateCampaignFailure),
      take(1)
    );
  }

  /**
   * Obtiene una campaña por su ID
   */
  getCampaignById(id: string): Observable<Campaign | null> {
    return this.store.select(CampaignSelectors.selectCampaignById(id));
  }

  /**
   * Inicia la recolección de datos de una campaña
   */
  startCampaign(campaignId: string): Observable<any> {
    this.store.dispatch(CampaignActions.startCampaign({ id: campaignId }));
    
    return this.actions$.pipe(
      ofType(CampaignActions.startCampaignSuccess, CampaignActions.startCampaignFailure),
      take(1)
    );
  }

  /**
   * Detiene la recolección de datos de una campaña
   */
  stopCampaign(campaignId: string): Observable<any> {
    this.store.dispatch(CampaignActions.stopCampaign({ id: campaignId }));
    
    return this.actions$.pipe(
      ofType(CampaignActions.stopCampaignSuccess, CampaignActions.stopCampaignFailure),
      take(1)
    );
  }

  /**
   * Elimina una campaña
   */
  deleteCampaign(campaignId: string): Observable<any> {
    this.store.dispatch(CampaignActions.deleteCampaign({ id: campaignId }));
    
    return this.actions$.pipe(
      ofType(CampaignActions.deleteCampaignSuccess, CampaignActions.deleteCampaignFailure),
      take(1)
    );
  }

  /**
   * Limpia el estado de campañas
   */
  clearCampaigns(): void {
    this.store.dispatch(CampaignActions.clearCampaigns());
  }
}
