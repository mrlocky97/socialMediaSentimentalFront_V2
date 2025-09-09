import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CampaignAdapter } from '../../../features/campaign-dialog/adapters/campaign.adapter';
import { BackendApiService } from '../../services/backend-api.service';
import * as CampaignActions from '../actions/campaign.actions';

@Injectable()
export class CampaignEffects {
  // Usar inject() para la inyección de dependencias
  private actions$ = inject(Actions);
  private apiService = inject(BackendApiService);

  constructor() {}

  // Crear campaña
  createCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.createCampaign),
      switchMap(({ campaign }) => {
        // Añadir logging para depurar
        const campaignToCreate = CampaignAdapter.fromRequestToApi(campaign);
        console.log('Sending campaign to API:', campaignToCreate);

        return this.apiService.createCampaign(campaignToCreate).pipe(
          map((newCampaign) => {
            console.log('Campaign created successfully:', newCampaign);
            return CampaignActions.createCampaignSuccess({
              campaign: CampaignAdapter.fromApiToState(newCampaign),
            });
          }),
          catchError((error) => {
            console.error('Error creating campaign:', error);
            return of(CampaignActions.createCampaignFailure({ error }));
          })
        );
      })
    )
  );

  // Cargar campañas
  loadCampaigns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.loadCampaigns),
      switchMap(({ filter, page, pageSize, sort }) =>
        this.apiService.getCampaigns().pipe(
          map((campaigns) =>
            CampaignActions.loadCampaignsSuccess({
              campaigns: campaigns.map((campaign) => CampaignAdapter.fromApiToState(campaign)),
            })
          ),
          catchError((error) => of(CampaignActions.loadCampaignsFailure({ error })))
        )
      )
    )
  );

  // Actualizar campaña
  updateCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.updateCampaign),
      switchMap(({ id, campaign }) =>
        this.apiService.updateCampaign(id, CampaignAdapter.fromStateToApi(campaign as any)).pipe(
          map((updatedCampaign) =>
            CampaignActions.updateCampaignSuccess({
              campaign: CampaignAdapter.fromApiToState(updatedCampaign),
            })
          ),
          catchError((error) => of(CampaignActions.updateCampaignFailure({ error })))
        )
      )
    )
  );

  // Eliminar campaña
  deleteCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.deleteCampaign),
      switchMap(({ id }) =>
        this.apiService.deleteCampaign(id).pipe(
          map(() => CampaignActions.deleteCampaignSuccess({ id })),
          catchError((error) => of(CampaignActions.deleteCampaignFailure({ error })))
        )
      )
    )
  );

  // Iniciar campaña
  startCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.startCampaign),
      switchMap(({ id }) =>
        this.apiService.toggleCampaign(id, 'start').pipe(
          map((updatedCampaign) => CampaignActions.startCampaignSuccess({ id })),
          catchError((error) => of(CampaignActions.startCampaignFailure({ error })))
        )
      )
    )
  );

  // Detener campaña
  stopCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.stopCampaign),
      switchMap(({ id }) =>
        this.apiService.toggleCampaign(id, 'stop').pipe(
          map((updatedCampaign) => CampaignActions.stopCampaignSuccess({ id })),
          catchError((error) => of(CampaignActions.stopCampaignFailure({ error })))
        )
      )
    )
  );
}
