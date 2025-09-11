/* =====================================
   DIALOG CONFIGURATION INTERFACES
   Comprehensive types for dialog system
   ===================================== */

export interface DialogConfig {
  title?: string;
  message?: string;
  content?: string;
  type?: DialogType;
  size?: DialogSize;
  position?: DialogPosition;
  buttons?: DialogButton[];
  showCloseButton?: boolean;
  disableClose?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  backdrop?: boolean | 'static';
  panelClass?: string | string[];
  data?: any;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export interface DialogButton {
  text: string;
  type?: ButtonType;
  color?: ButtonColor;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  autoClose?: boolean;
  handler?: () => void | Promise<void>;
}

export interface DialogResult {
  action: string;
  data?: any;
  button?: DialogButton;
}

export type DialogType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'confirm' 
  | 'custom';

export type DialogSize = 
  | 'xs' 
  | 'sm' 
  | 'md' 
  | 'lg' 
  | 'xl' 
  | 'full';

export type DialogPosition = 
  | 'center' 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right';

export type ButtonType = 
  | 'basic' 
  | 'raised' 
  | 'stroked' 
  | 'flat' 
  | 'icon' 
  | 'fab' 
  | 'mini-fab';

export type ButtonColor = 
  | 'primary' 
  | 'accent' 
  | 'warn' 
  | 'success' 
  | 'info' 
  | 'default';

export interface DialogData {
  config: DialogConfig;
  customContent?: any;
}

// Predefined dialog configurations
export const DialogPresets = {
  CONFIRM_DELETE: {
    title: 'Confirmar eliminación',
    message: '¿Estás seguro de que quieres eliminar este elemento?',
    type: 'warning' as DialogType,
    size: 'sm' as DialogSize,
    buttons: [
      {
        text: 'Cancelar',
        type: 'stroked' as ButtonType,
        color: 'default' as ButtonColor,
        action: 'cancel',
        autoClose: true
      },
      {
        text: 'Eliminar',
        type: 'raised' as ButtonType,
        color: 'warn' as ButtonColor,
        action: 'delete',
        autoClose: true,
        icon: 'delete'
      }
    ]
  },

  CONFIRM_SAVE: {
    title: 'Guardar cambios',
    message: '¿Quieres guardar los cambios realizados?',
    type: 'confirm' as DialogType,
    size: 'sm' as DialogSize,
    buttons: [
      {
        text: 'Cancelar',
        type: 'stroked' as ButtonType,
        color: 'default' as ButtonColor,
        action: 'cancel',
        autoClose: true
      },
      {
        text: 'No guardar',
        type: 'stroked' as ButtonType,
        color: 'warn' as ButtonColor,
        action: 'discard',
        autoClose: true
      },
      {
        text: 'Guardar',
        type: 'raised' as ButtonType,
        color: 'primary' as ButtonColor,
        action: 'save',
        autoClose: true,
        icon: 'save'
      }
    ]
  },

  SUCCESS_MESSAGE: {
    title: 'Operación exitosa',
    type: 'success' as DialogType,
    size: 'sm' as DialogSize,
    showCloseButton: true,
    buttons: [
      {
        text: 'Aceptar',
        type: 'raised' as ButtonType,
        color: 'success' as ButtonColor,
        action: 'ok',
        autoClose: true
      }
    ]
  },

  ERROR_MESSAGE: {
    title: 'Error',
    type: 'error' as DialogType,
    size: 'sm' as DialogSize,
    showCloseButton: true,
    buttons: [
      {
        text: 'Cerrar',
        type: 'raised' as ButtonType,
        color: 'warn' as ButtonColor,
        action: 'close',
        autoClose: true
      }
    ]
  },

  INFO_MESSAGE: {
    title: 'Información',
    type: 'info' as DialogType,
    size: 'sm' as DialogSize,
    showCloseButton: true,
    buttons: [
      {
        text: 'Entendido',
        type: 'raised' as ButtonType,
        color: 'primary' as ButtonColor,
        action: 'ok',
        autoClose: true
      }
    ]
  },

  LOADING: {
    title: 'Procesando...',
    type: 'info' as DialogType,
    size: 'sm' as DialogSize,
    showCloseButton: false,
    disableClose: true,
    backdrop: 'static' as const
  }
} as const;
