import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  Inject,
  Injector,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FormSubmitEvent } from '../reactive-form/interfaces/form-field.interface';
import { ReactiveFormComponent } from '../reactive-form/reactive-form.component';

import {
  DialogButton,
  DialogConfig,
  DialogData,
  DialogResult,
  DialogType,
} from './interfaces/dialog-config.interface';

/**
 * ReusableDialogComponent - Componente de diálogo reutilizable
 *
 * Características:
 * - Configuración completa mediante DialogConfig
 * - Múltiples tipos (info, success, warning, error, confirm, custom)
 * - Botones personalizables con diferentes estilos
 * - Soporte para contenido personalizado
 * - Responsive y accesible
 * - Iconos automáticos según el tipo
 * - Animaciones y efectos modernos
 */
@Component({
  selector: 'app-reusable-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    ReactiveFormComponent,
  ],
  templateUrl: './reusable-dialog.component.html',
  styleUrl: './reusable-dialog.component.css',
})
export class ReusableDialogComponent implements OnInit {
  // Outputs para comunicación con el componente padre
  @Output() buttonClicked = new EventEmitter<{
    action: string;
    button: DialogButton;
    data?: any;
  }>();
  @Output() formSubmitted = new EventEmitter<FormSubmitEvent>();
  @Output() dialogClosed = new EventEmitter<DialogResult>();
  @Output() dialogOpened = new EventEmitter<void>();

  // Signals para estado reactivo
  config = signal<DialogConfig>({});
  loadingButtons = signal<Set<string>>(new Set());

  // Computed para clases CSS dinámicas
  dialogTypeClass = computed(() => `dialog-type-${this.config().type || 'custom'}`);
  dialogSizeClass = computed(() => `dialog-size-${this.config().size || 'md'}`);

  constructor(
    public dialogRef: MatDialogRef<ReusableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private injector: Injector
  ) {
    this.config.set(data?.config || {});

    // Configurar opciones del diálogo
    this.setupDialogOptions();
  }

  ngOnInit(): void {
    // Aplicar configuración automática según el tipo
    this.applyTypeDefaults();

    // Emitir evento de apertura
    this.dialogOpened.emit();
  }

  /**
   * Configura las opciones del MatDialog según la configuración
   */
  private setupDialogOptions(): void {
    const config = this.config();

    if (config.disableClose !== undefined) {
      this.dialogRef.disableClose = config.disableClose;
    }

    if (config.backdrop === 'static') {
      this.dialogRef.disableClose = true;
    }
  }

  /**
   * Aplica configuraciones por defecto según el tipo de diálogo
   */
  private applyTypeDefaults(): void {
    const currentConfig = this.config();
    const updatedConfig = { ...currentConfig };

    // Configurar showCloseButton por defecto
    if (updatedConfig.showCloseButton === undefined) {
      updatedConfig.showCloseButton = updatedConfig.type !== 'custom';
    }

    // Configurar botones por defecto si no se especifican
    if (!updatedConfig.buttons || updatedConfig.buttons.length === 0) {
      updatedConfig.buttons = this.getDefaultButtons(updatedConfig.type);
    }

    this.config.set(updatedConfig);
  }

  /**
   * Obtiene botones por defecto según el tipo
   */
  private getDefaultButtons(type?: DialogType): DialogButton[] {
    switch (type) {
      case 'confirm':
        return [
          {
            text: 'Cancelar',
            type: 'stroked',
            color: 'default',
            action: 'cancel',
            autoClose: true,
          },
          {
            text: 'Confirmar',
            type: 'raised',
            color: 'primary',
            action: 'confirm',
            autoClose: true,
          },
        ];
      case 'error':
        return [
          {
            text: 'Cerrar',
            type: 'raised',
            color: 'warn',
            action: 'close',
            autoClose: true,
          },
        ];
      case 'success':
        return [
          {
            text: 'Aceptar',
            type: 'raised',
            color: 'success',
            action: 'ok',
            autoClose: true,
          },
        ];
      case 'warning':
        return [
          {
            text: 'Entendido',
            type: 'raised',
            color: 'warn',
            action: 'ok',
            autoClose: true,
          },
        ];
      case 'info':
      default:
        return [
          {
            text: 'Aceptar',
            type: 'raised',
            color: 'primary',
            action: 'ok',
            autoClose: true,
          },
        ];
    }
  }

  /**
   * Verifica si hay botones en estado de loading
   */
  hasLoadingButtons(): boolean {
    return this.loadingButtons().size > 0;
  }

  /**
   * Obtiene el icono según el tipo de diálogo
   */
  getTypeIcon(): string {
    switch (this.config().type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'confirm':
        return 'help_outline';
      default:
        return '';
    }
  }

  /**
   * Obtiene las clases CSS para el diálogo
   */
  getDialogClasses(): string {
    const classes = [this.dialogTypeClass(), this.dialogSizeClass()];

    const panelClass = this.config().panelClass;
    if (panelClass) {
      if (Array.isArray(panelClass)) {
        classes.push(...panelClass);
      } else {
        classes.push(panelClass);
      }
    }

    return classes.join(' ');
  }

  /**
   * Obtiene las clases CSS para el icono
   */
  getIconClasses(): string {
    const type = this.config().type;
    return `dialog-icon-${type}`;
  }

  /**
   * Obtiene el tipo de botón para el elemento button
   */
  getButtonType(button: DialogButton): string {
    return button.type === 'raised' ? 'submit' : 'button';
  }

  /**
   * Obtiene las clases CSS para un botón
   */
  getButtonClasses(button: DialogButton): string {
    const classes = ['dialog-button'];

    // Tipo de botón Material
    switch (button.type) {
      case 'raised':
        classes.push('mat-raised-button');
        break;
      case 'stroked':
        classes.push('mat-stroked-button');
        break;
      case 'flat':
        classes.push('mat-flat-button');
        break;
      case 'icon':
        classes.push('mat-icon-button');
        break;
      case 'fab':
        classes.push('mat-fab');
        break;
      case 'mini-fab':
        classes.push('mat-mini-fab');
        break;
      default:
        classes.push('mat-button');
    }

    // Color del botón
    if (button.color) {
      classes.push(`mat-${button.color}`);
    }

    // Estados del botón
    if (button.disabled) {
      classes.push('button-disabled');
    }

    if (button.loading) {
      classes.push('button-loading');
    }

    return classes.join(' ');
  }

  /**
   * Maneja el clic en un botón
   */
  async handleButtonClick(button: DialogButton): Promise<void> {
    console.log('🔥 Dialog handleButtonClick called with button:', button);
    
    // Emitir evento de clic de botón
    this.buttonClicked.emit({
      action: button.action || button.text,
      button: button,
      data: this.data?.customContent?.data,
    });

    // Si es un botón de submit y hay un formulario personalizado, ejecutar submit
    if (button.action === 'submit' && this.data.customContent?.component) {
      console.log('🎯 Submit button clicked, looking for form...');
      // Buscar el componente de formulario reactivo en el DOM
      const formElement = document.querySelector('app-reactive-form form');
      if (formElement) {
        console.log('✅ Form found, dispatching submit event');
        // Disparar evento de submit del formulario
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        formElement.dispatchEvent(submitEvent);
      } else {
        console.log('❌ Form not found in DOM');
      }
      // No ejecutar lógica de cierre automático para botones submit
      return;
    }

    // Marcar botón como loading si tiene handler asíncrono
    if (button.handler) {
      console.log('🎯 Button has handler, executing...');
      this.setButtonLoading(button.action || button.text, true);

      try {
        await button.handler();
      } catch (error) {
        console.error('Error executing button handler:', error);
      } finally {
        this.setButtonLoading(button.action || button.text, false);
      }
    }

    // Cerrar diálogo si está configurado para auto-cerrar
    if (button.autoClose !== false) {
      console.log('🚪 Auto-closing dialog');
      this.closeDialog(button.action || button.text, button);
    }
  }

  /**
   * Establece el estado de loading de un botón
   */
  private setButtonLoading(buttonId: string, loading: boolean): void {
    const loadingSet = new Set(this.loadingButtons());

    if (loading) {
      loadingSet.add(buttonId);
    } else {
      loadingSet.delete(buttonId);
    }

    this.loadingButtons.set(loadingSet);

    // Actualizar el estado del botón en la configuración
    const currentConfig = this.config();
    const updatedButtons = currentConfig.buttons?.map((btn) => {
      if ((btn.action || btn.text) === buttonId) {
        return { ...btn, loading };
      }
      return btn;
    });

    this.config.set({
      ...currentConfig,
      buttons: updatedButtons,
    });
  }

  /**
   * Cierra el diálogo con un resultado
   */
  closeDialog(action: string, button?: DialogButton): void {
    const result: DialogResult = {
      action,
      data: this.data?.customContent?.data,
      button,
    };

    // Emitir evento de cierre
    this.dialogClosed.emit(result);

    this.dialogRef.close(result);
  }

  /**
   * Crea un injector personalizado para el componente dinámico
   */
  getCustomInjector(): Injector {
    if (!this.data.customContent?.data) {
      return this.injector;
    }

    // Crear tokens para cada propiedad de data
    const providers: any[] = [];

    // Inyectar los datos del componente personalizado
    if (this.data.customContent.data) {
      Object.keys(this.data.customContent.data).forEach((key) => {
        providers.push({
          provide: key,
          useValue: this.data.customContent.data[key],
        });
      });
    }

    return Injector.create({
      parent: this.injector,
      providers,
    });
  }

  /**
   * Verifica si el componente personalizado es ReactiveFormComponent
   */
  isReactiveFormComponent(): boolean {
    return this.data.customContent?.component === ReactiveFormComponent;
  }

  /**
   * Maneja el submit del formulario personalizado
   */
  handleCustomFormSubmit(event: FormSubmitEvent): void {
    console.log('🔥 Dialog handleCustomFormSubmit called with event:', event);
    
    // Emitir evento de submit del formulario
    this.formSubmitted.emit(event);

    // Llamar al handler si existe
    if (this.data.customContent?.data?.onSubmit) {
      console.log('🎯 Calling onSubmit handler');
      try {
        this.data.customContent.data.onSubmit(event);
        // El handler se encargará de cerrar el diálogo si es necesario
      } catch (error) {
        console.error('Error in onSubmit handler:', error);
      }
    } else {
      console.log('⚠️ No onSubmit handler found');
    }
  }

  /**
   * TrackBy function para optimizar la renderización de botones
   */
  trackByButton(index: number, button: DialogButton): string {
    return button.action || button.text || index.toString();
  }
}
