import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {
  DialogConfig,
  DialogData,
  DialogPresets,
  DialogResult
} from '../interfaces/dialog-config.interface';
import { ReusableDialogComponent } from '../reusable-dialog.component';

/**
 * DialogService - Servicio para manejar diálogos reutilizables
 *
 * Características:
 * - Métodos simples para tipos comunes de diálogos
 * - Configuración avanzada personalizable
 * - Presets predefinidos para casos comunes
 * - Soporte para contenido personalizado
 * - Gestión automática de tamaños y posiciones
 */
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  /**
   * Abre un diálogo personalizado con configuración completa
   */
  open(config: DialogConfig, customContent?: any): Observable<DialogResult | undefined> {
    const dialogData: DialogData = {
      config,
      customContent,
    };

    const dialogRef = this.dialog.open(ReusableDialogComponent, {
      data: dialogData,
      width: config.width || this.getDefaultWidth(config.size),
      height: config.height,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      maxWidth: config.maxWidth || '90vw',
      maxHeight: config.maxHeight || '90vh',
      disableClose: config.disableClose || false,
      autoFocus: config.autoFocus !== false,
      restoreFocus: config.restoreFocus !== false,
      panelClass: this.getPanelClasses(config),
      backdropClass: config.backdrop === 'static' ? 'static-backdrop' : undefined,
      position: this.getDialogPosition(config.position),
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un diálogo de confirmación
   */
  confirm(
    title: string,
    message: string,
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.CONFIRM_DELETE),
      title,
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de confirmación para eliminar
   */
  confirmDelete(
    message: string = '¿Estás seguro de que quieres eliminar este elemento?',
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.CONFIRM_DELETE),
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de confirmación para guardar cambios
   */
  confirmSave(
    message: string = '¿Quieres guardar los cambios realizados?',
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.CONFIRM_SAVE),
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de información
   */
  info(
    title: string,
    message: string,
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.INFO_MESSAGE),
      title,
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de éxito
   */
  success(
    title: string,
    message: string,
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.SUCCESS_MESSAGE),
      title,
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de error
   */
  error(
    title: string,
    message: string,
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.ERROR_MESSAGE),
      title,
      message,
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de advertencia
   */
  warning(
    title: string,
    message: string,
    options?: Partial<DialogConfig>
  ): Observable<DialogResult | undefined> {
    const config: DialogConfig = {
      title,
      message,
      type: 'warning',
      size: 'sm',
      showCloseButton: true,
      buttons: [
        {
          text: 'Entendido',
          type: 'raised',
          color: 'warn',
          action: 'ok',
          autoClose: true,
        },
      ],
      ...options,
    };

    return this.open(config);
  }

  /**
   * Muestra un diálogo de carga
   */
  loading(
    title: string = 'Procesando...',
    options?: Partial<DialogConfig>
  ): MatDialogRef<ReusableDialogComponent> {
    const config: DialogConfig = {
      ...this.clonePreset(DialogPresets.LOADING),
      title,
      ...options,
    };

    const dialogData: DialogData = {
      config,
    };

    return this.dialog.open(ReusableDialogComponent, {
      data: dialogData,
      width: this.getDefaultWidth(config.size),
      disableClose: true,
      panelClass: this.getPanelClasses(config),
      backdropClass: 'static-backdrop',
    });
  }

  /**
   * Muestra un diálogo con contenido personalizado
   */
  custom(config: DialogConfig, customContent?: any): Observable<DialogResult | undefined> {
    return this.open({ ...config, type: 'custom' }, customContent);
  }

  /**
   * Cierra todos los diálogos abiertos
   */
  closeAll(): void {
    this.dialog.closeAll();
  }

  /**
   * Obtiene si hay diálogos abiertos
   */
  hasOpenDialogs(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  /**
   * Clona un preset para evitar problemas de mutabilidad
   */
  private clonePreset(preset: any): DialogConfig {
    return JSON.parse(JSON.stringify(preset));
  }

  /**
   * Obtiene el ancho por defecto según el tamaño
   */
  private getDefaultWidth(size?: string): string {
    switch (size) {
      case 'xs':
        return '300px';
      case 'sm':
        return '400px';
      case 'md':
        return '500px';
      case 'lg':
        return '700px';
      case 'xl':
        return '900px';
      case 'full':
        return '95vw';
      default:
        return '500px';
    }
  }

  /**
   * Obtiene las clases CSS del panel
   */
  private getPanelClasses(config: DialogConfig): string[] {
    const classes = ['modern-dialog'];

    if (config.type) {
      classes.push(`dialog-${config.type}`);
    }

    if (config.size) {
      classes.push(`dialog-${config.size}`);
    }

    if (config.panelClass) {
      if (Array.isArray(config.panelClass)) {
        classes.push(...config.panelClass);
      } else {
        classes.push(config.panelClass);
      }
    }

    return classes;
  }

  /**
   * Obtiene la posición del diálogo
   */
  private getDialogPosition(position?: string) {
    switch (position) {
      case 'top':
        return { top: '10vh' };
      case 'bottom':
        return { bottom: '10vh' };
      case 'left':
        return { left: '10vw' };
      case 'right':
        return { right: '10vw' };
      case 'center':
      default:
        return undefined;
    }
  }
}

// Utilidades adicionales para casos específicos
export class DialogUtils {
  /**
   * Crea un diálogo de confirmación para operaciones destructivas
   */
  static createDestructiveConfirm(action: string, itemName?: string): DialogConfig {
    return {
      title: `Confirmar ${action}`,
      message: itemName
        ? `¿Estás seguro de que quieres ${action.toLowerCase()} "${itemName}"?`
        : `¿Estás seguro de que quieres ${action.toLowerCase()} este elemento?`,
      type: 'warning',
      size: 'sm',
      buttons: [
        {
          text: 'Cancelar',
          type: 'stroked',
          color: 'default',
          action: 'cancel',
          autoClose: true,
        },
        {
          text: action,
          type: 'raised',
          color: 'warn',
          action: 'confirm',
          autoClose: true,
          icon: action.toLowerCase().includes('eliminar') ? 'delete' : 'warning',
        },
      ],
    };
  }

  /**
   * Crea un diálogo de confirmación para guardado
   */
  static createSaveConfirm(hasChanges: boolean = true): DialogConfig {
    if (!hasChanges) {
      return {
        title: 'Sin cambios',
        message: 'No hay cambios para guardar.',
        type: 'info',
        size: 'sm',
        buttons: [
          {
            text: 'Entendido',
            type: 'raised',
            color: 'primary',
            action: 'ok',
            autoClose: true,
          },
        ],
      };
    }

    return JSON.parse(JSON.stringify(DialogPresets.CONFIRM_SAVE));
  }

  /**
   * Crea un diálogo de resultado de operación
   */
  static createOperationResult(
    success: boolean,
    operation: string,
    details?: string
  ): DialogConfig {
    if (success) {
      return {
        title: 'Operación exitosa',
        message: `${operation} completado exitosamente.${details ? ` ${details}` : ''}`,
        type: 'success',
        size: 'sm',
        buttons: [
          {
            text: 'Aceptar',
            type: 'raised',
            color: 'success',
            action: 'ok',
            autoClose: true,
            icon: 'check',
          },
        ],
      };
    } else {
      return {
        title: 'Error en la operación',
        message: `No se pudo completar ${operation.toLowerCase()}.${details ? ` ${details}` : ''}`,
        type: 'error',
        size: 'sm',
        buttons: [
          {
            text: 'Cerrar',
            type: 'raised',
            color: 'warn',
            action: 'close',
            autoClose: true,
            icon: 'close',
          },
        ],
      };
    }
  }
}
