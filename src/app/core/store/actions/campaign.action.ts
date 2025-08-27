

// ... otras acciones

import { createAction, props } from "@ngrx/store";
import { CampaignRequest } from "../../../features/campaign-dialog/interfaces/campaign-dialog.interface";
import { Campaign } from "../../types";

// Acciones para crear una campaña
export const createCampaign = createAction(
  '[Campaigns API] Create Campaign',
  props<{ campaign: CampaignRequest }>()
);

export const createCampaignSuccess = createAction(
  '[Campaigns API] Create Campaign Success',
  props<{ campaign: Campaign }>()
);

export const createCampaignFailure = createAction(
  '[Campaigns API] Create Campaign Failure',
  props<{ error: any }>()
);
