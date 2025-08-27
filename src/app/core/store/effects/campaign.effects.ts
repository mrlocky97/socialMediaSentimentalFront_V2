// ... existing imports
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable()
export class CampaignEffects {
  constructor(private actions$: Actions, private apiService: ApiService) {}

  // ... otros efectos

  createCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.createCampaign),
      switchMap(({ campaign }) =>
        this.apiService.createCampaign(campaign).pipe(
          map((newCampaign) => CampaignActions.createCampaignSuccess({ campaign: newCampaign })),
          catchError((error) => of(CampaignActions.createCampaignFailure({ error })))
        )
      )
    )
  );
}
