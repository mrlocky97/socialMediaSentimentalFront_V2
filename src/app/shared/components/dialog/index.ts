/* =====================================
   DIALOG COMPONENT EXPORTS
   Barrel exports for dialog module
   ===================================== */

// Component
export { ReusableDialogComponent } from './reusable-dialog.component';

// Service
export { DialogService, DialogUtils } from './services/dialog.service';

// Interfaces and Types
export type {
  DialogConfig,
  DialogButton,
  DialogResult,
  DialogData,
  DialogType,
  DialogSize,
  DialogPosition,
  ButtonType,
  ButtonColor
} from './interfaces/dialog-config.interface';

// Constants
export { DialogPresets } from './interfaces/dialog-config.interface';

// Re-export everything for convenience
export * from './reusable-dialog.component';
export * from './services/dialog.service';
