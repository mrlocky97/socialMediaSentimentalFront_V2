import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { LanguageService } from '../../core/services/language.service';
import { CampaignType } from '../../core/types';
import { CampaignRequest, CreateCampaignDialogData } from './interfaces/campaign-dialog.interface';

type DataSource = 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'facebook';

@Component({
  selector: 'app-campaign-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    // Accesibilidad
    A11yModule,
    // Transloco para traducciones
    TranslocoModule,
    MatProgressBarModule,
  ],
  templateUrl: './campaign-dialog.component.html',
  styleUrls: ['./campaign-dialog.component.css'],
})
export class CampaignDialogComponent implements OnInit, AfterViewInit {
  // Inyecciones
  public transloco = inject(TranslocoService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<CampaignDialogComponent, any>);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);
  data = inject<CreateCampaignDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  // Estado UI
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isEditModeSignal = signal<boolean>(false);
  readonly isViewModeSignal = signal<boolean>(false);
  readonly campaignId = signal<string | null>(null);

  // Fecha mínima para el date picker (hoy)
  get today(): Date {
    return new Date();
  }

  // Exponer isEditMode para la plantilla
  get isEditMode(): boolean {
    return this.isEditModeSignal();
  }

  // Exponer isViewMode para la plantilla
  get isViewMode(): boolean {
    return this.isViewModeSignal();
  }

  // Obtener etiqueta para datasource por valor
  getDataSourceLabel(value: string): string {
    const source = this.dataSourceOptions.find((src) => src.value === value);
    return source ? source.label : value;
  }

  // --- Formulario Reactivo ---
  // Campos base
  form = this.fb.group(
    {
      // ID de campaña (oculto, solo para edición)
      id: [''],

      // Basic info
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: this.fb.control<CampaignType | string>('hashtag', {
        validators: [Validators.required],
      }),

      // Targeting
      hashtags: this.fb.array<FormControl<string>>([], []),
      keywords: this.fb.array<FormControl<string>>([], []),
      mentions: this.fb.array<FormControl<string>>([], []),

      // Fuentes y settings
      dataSources: this.fb.control<DataSource[]>([], [Validators.required, this.minLengthArray(1)]),
      languages: this.fb.control<string>(this.languageService.getCurrentLanguage()),

      // Fechas (usando date range picker)
      startDate: [null as Date | null, Validators.required],
      endDate: [null as Date | null, Validators.required],
      timezone: this.fb.control('UTC', [Validators.required]),

      maxTweets: this.fb.control(10, [
        Validators.required,
        Validators.min(10),
        Validators.max(1000),
      ]),

      // Flags de colección
      collectImages: this.fb.control(true),
      collectVideos: this.fb.control(true),
      collectReplies: this.fb.control(false),
      collectRetweets: this.fb.control(true),

      // Analítica
      sentimentAnalysis: this.fb.control(true),
      emotionAnalysis: this.fb.control(false),
      topicsAnalysis: this.fb.control(false),
      influencerAnalysis: this.fb.control(false),

      // Org
      organizationId: ['org-default-id', Validators.required],
    },
    {
      validators: [
        this.dateRangeValidator(),
        this.atLeastOneTargetingValidator(['hashtags', 'keywords', 'mentions']),
      ],
    }
  );

  // Opciones UI
  readonly typeOptions: { value: CampaignType | string; label: string; icon: string }[] = [
    { value: 'hashtag', label: 'Hashtag', icon: 'tag' },
    { value: 'keyword', label: 'Keyword', icon: 'search' },
    { value: 'user', label: 'User', icon: 'person' },
    { value: 'custom', label: 'Custom', icon: 'tune' },
  ];

  readonly dataSourceOptions: { value: DataSource; label: string }[] = [
    { value: 'twitter', label: 'Twitter/X' },
    // { value: 'instagram', label: 'Instagram' },
    // { value: 'tiktok', label: 'TikTok' },
    // { value: 'youtube', label: 'YouTube' },
    // { value: 'facebook', label: 'Facebook' },
  ];

  // readonly languageOptions = ['en', 'es', 'fr', 'de'];

  constructor() {
    // Determinar el modo del diálogo
    this.isEditModeSignal.set(this.data?.mode === 'edit');
    this.isViewModeSignal.set(this.data?.mode === 'view');

    if (this.isEditModeSignal() || this.isViewModeSignal()) {
      // Si estamos en modo edición o vista, guardamos el ID de la campaña
      if (this.data?.campaignId) {
        this.campaignId.set(this.data.campaignId);
      } else {
        console.error(`Modo ${this.data?.mode} sin ID de campaña`);
      }
    }

    // Si estamos en modo vista, hacemos que el formulario sea de solo lectura
    if (this.isViewModeSignal()) {
      // Esperamos hasta después de la inicialización para deshabilitar el formulario
      setTimeout(() => {
        this.form.disable();
      });
    }

    // Preload (si viene preset)
    const p = this.data?.preset ?? {};

    // Primero limpiamos los arrays existentes por si acaso
    while (this.hashtags.length) this.hashtags.removeAt(0);
    while (this.keywords.length) this.keywords.removeAt(0);
    while (this.mentions.length) this.mentions.removeAt(0);

    // Luego añadimos los elementos de los arrays con valores reales
    (p.hashtags ?? []).forEach((v) => this.addControl(this.hashtags, v));
    (p.keywords ?? []).forEach((v) => this.addControl(this.keywords, v));
    (p.mentions ?? []).forEach((v) => this.addControl(this.mentions, v));

    // Asegurarnos de que dataSources y languages son arrays válidos
    const dataSources = Array.isArray(p.dataSources) ? p.dataSources : [];

    // Ahora hacemos el patch value después de tener los arrays configurados
    this.form.patchValue(
      {
        // ID de campaña (para edición)
        id: this.data?.campaignId ?? '',

        // Información básica
        name: p.name ?? '',
        description: p.description ?? '',
        type: p.type ?? 'hashtag',

        // Arrays - asegurarnos de que son arrays válidos
        dataSources: dataSources,
        languages: this.languageService.getCurrentLanguage(),

        // Configuración
        maxTweets: p.maxTweets ?? 1000,

        // Checkboxes de colección
        collectImages: p.collectImages ?? true,
        collectVideos: p.collectVideos ?? true,
        collectReplies: p.collectReplies ?? false,
        collectRetweets: p.collectRetweets ?? true,

        // Checkboxes de análisis
        sentimentAnalysis: p.sentimentAnalysis ?? true,
        emotionAnalysis: p.emotionAnalysis ?? false,
        topicsAnalysis: p.topicsAnalysis ?? false,
        influencerAnalysis: p.influencerAnalysis ?? false,

        // Organización
        organizationId: p.organizationId ?? 'org-default-id',

        // Fechas (configurar directamente)
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
      },
      { emitEvent: false }
    );

    // Forzar detección de cambios en caso de que haya problemas de actualización
    setTimeout(() => {
      // Validamos el formulario para actualizar estado
      this.form.updateValueAndValidity();
    }, 0);

    // Limpiar mensaje de error al cambiar el form
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.submitError()) this.submitError.set(null);
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
  }

  // ---- Getters de arrays ----
  get hashtags() {
    return this.form.get('hashtags') as FormArray<FormControl<string>>;
  }
  get keywords() {
    return this.form.get('keywords') as FormArray<FormControl<string>>;
  }
  get mentions() {
    return this.form.get('mentions') as FormArray<FormControl<string>>;
  }

  // ---- Helpers arrays ----
  addControl(arr: FormArray<FormControl<string>>, initial = '') {
    arr.push(this.fb.control(initial, { nonNullable: true, validators: [Validators.required] }));
  }
  removeControl(arr: FormArray<FormControl<string>>, i: number) {
    if (i >= 0 && i < arr.length) arr.removeAt(i);
  }
  // ---- Validadores custom ----
  private minLengthArray(min: number) {
    return (control: AbstractControl) => {
      const arr = control.value as any[];
      return Array.isArray(arr) && arr.length >= min
        ? null
        : { minLengthArray: { requiredLength: min } };
    };
  }

  /**
   * @returns Validador que verifica que el rango de fechas es correcto (start < end)
   */
  private dateRangeValidator() {
    return (group: AbstractControl) => {
      const g = group as FormGroup;
      const start = g.get('startDate')?.value;
      const end = g.get('endDate')?.value;

      if (!start || !end) return null;

      const startDate = new Date(start);
      const endDate = new Date(end);

      return startDate < endDate ? null : { dateRange: true };
    };
  }


  /** Al menos uno entre hashtags/keywords/mentions con contenido */
  private atLeastOneTargetingValidator(keys: string[]) {
    return (group: AbstractControl) => {
      const g = group as FormGroup;
      const hasAny = keys.some((k) => {
        const arr = g.get(k) as FormArray<FormControl<string>>;
        return arr && arr.length > 0 && arr.value.some((v) => (v ?? '').trim().length > 0);
      });
      return hasAny ? null : { noTargeting: true };
    };
  }

  // ---- Acciones ----
  cancel() {
    this.dialogRef.close(null);
  }

  async submit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.submitError.set(null);

    const v = this.form.value;

    // Función helper para formatear fechas manteniendo la zona horaria local
    const formatDateForAPI = (date: any): string => {
      if (!date) return '';

      let dateObj: Date;

      // Si ya es un objeto Date de Material Datepicker
      if (date instanceof Date) {
        dateObj = date;
      } else {
        // Si es string o cualquier otro formato
        dateObj = new Date(date);
      }

      // Verificar que la fecha es válida
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return '';
      }

      // Crear fecha al inicio del día en la zona horaria local del usuario
      // Esto evita problemas de conversión UTC
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();

      const localDate = new Date(year, month, day, 12, 0, 0); // Usar mediodía para evitar problemas de DST

      return localDate.toISOString();
    };

    // Construir payload conforme al API
    const payload: CampaignRequest = {
      name: v.name!,
      description: v.description!,
      type: v.type!,
      dataSources: (v.dataSources ?? []) as DataSource[],
      hashtags: (this.hashtags.value ?? []).map((s) => s.trim()),
      keywords: (this.keywords.value ?? []).map((s) => s.trim()),
      mentions: (this.mentions.value ?? []).map((s) => s.trim()),
      startDate: formatDateForAPI(v.startDate),
      endDate: formatDateForAPI(v.endDate),
      maxTweets: v.maxTweets!,
      collectImages: !!v.collectImages,
      collectVideos: !!v.collectVideos,
      collectReplies: !!v.collectReplies,
      collectRetweets: !!v.collectRetweets,
      languages: v.languages || 'en',
      sentimentAnalysis: !!v.sentimentAnalysis,
      emotionAnalysis: !!v.emotionAnalysis,
      topicsAnalysis: !!v.topicsAnalysis,
      influencerAnalysis: !!v.influencerAnalysis,
      organizationId: v.organizationId!,
    };

    // Obtener el ID de la campaña para edición (prioridad: form.id > campaignId signal > data.campaignId)
    const campaignId = v.id || this.campaignId() || this.data?.campaignId || null;

    // Añadir el ID a la payload para operaciones de actualización
    if (this.isEditModeSignal() && campaignId) {
      Object.assign(payload, { id: campaignId });
    }

    // Devolver el resultado con información del modo (create/edit)
    const result = {
      payload,
      mode: this.isEditModeSignal() ? 'edit' : 'create',
      id: campaignId, // ID de la campaña para operaciones de update
    };

    this.dialogRef.close(result);
  }
}
