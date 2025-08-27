import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
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
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
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
    // Accesibilidad
    A11yModule,
    // Transloco para traducciones
    TranslocoModule,
    MatProgressBarModule,
  ],
  templateUrl: './campaign-dialog.component.html',
  styleUrls: ['./campaign-dialog.component.css'],
})
export class CampaignDialogComponent {
  // Inyecciones
  public transloco = inject(TranslocoService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<CampaignDialogComponent, any>);
  private destroyRef = inject(DestroyRef);
  data = inject<CreateCampaignDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  // Estado UI
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isEditModeSignal = signal<boolean>(false);
  readonly campaignId = signal<string | null>(null);

  // Exponer isEditMode para la plantilla
  get isEditMode(): boolean {
    return this.isEditModeSignal();
  }

  // --- Formulario Reactivo ---
  // Campos base
  form = this.fb.group(
    {
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
      languages: this.fb.control<string[]>([]),

      // Fechas (usamos datetime-local y convertimos a ISO al enviar)
      startDateLocal: ['', Validators.required],
      endDateLocal: ['', Validators.required],
      timezone: this.fb.control('UTC', [Validators.required]),

      maxTweets: this.fb.control(1000, [
        Validators.required,
        Validators.min(100),
        Validators.max(10000),
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
      organizationId: ['', Validators.required],
    },
    {
      validators: [
        this.dateRangeValidator('startDateLocal', 'endDateLocal'),
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
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'facebook', label: 'Facebook' },
  ];

  readonly languageOptions = ['en', 'es', 'fr', 'de'];

  constructor() {
    // Determinar si estamos en modo edición
    this.isEditModeSignal.set(this.data?.mode === 'edit');

    if (this.isEditModeSignal()) {
      // Si estamos en modo edición, guardamos el ID de la campaña
      if (this.data?.campaignId) {
        this.campaignId.set(this.data.campaignId);
      } else {
        console.error('Modo de edición sin ID de campaña');
      }
    }

    // Preload (si viene preset)
    const p = this.data?.preset ?? {};
    console.log('Preset data in constructor:', p);

    // Primero limpiamos los arrays existentes por si acaso
    while (this.hashtags.length) this.hashtags.removeAt(0);
    while (this.keywords.length) this.keywords.removeAt(0);
    while (this.mentions.length) this.mentions.removeAt(0);

    // Luego añadimos los elementos de los arrays con valores reales
    (p.hashtags ?? []).forEach((v) => this.addControl(this.hashtags, v));
    (p.keywords ?? []).forEach((v) => this.addControl(this.keywords, v));
    (p.mentions ?? []).forEach((v) => this.addControl(this.mentions, v));

    // Ahora hacemos el patch value después de tener los arrays configurados
    this.form.patchValue(
      {
        name: p.name ?? '',
        description: p.description ?? '',
        type: p.type ?? 'hashtag',
        dataSources: p.dataSources ?? [],
        languages: p.languages ?? [],
        timezone: p.timezone ?? 'UTC',
        maxTweets: p.maxTweets ?? 1000,
        collectImages: p.collectImages ?? true,
        collectVideos: p.collectVideos ?? true,
        collectReplies: p.collectReplies ?? false,
        collectRetweets: p.collectRetweets ?? true,
        sentimentAnalysis: p.sentimentAnalysis ?? true,
        emotionAnalysis: p.emotionAnalysis ?? false,
        topicsAnalysis: p.topicsAnalysis ?? false,
        influencerAnalysis: p.influencerAnalysis ?? false,
        organizationId: p.organizationId ?? '',
        // start/end locales si vienen ISO
        startDateLocal: p.startDate ? this.isoToLocalDatetime(p.startDate) : '',
        endDateLocal: p.endDate ? this.isoToLocalDatetime(p.endDate) : '',
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

  private dateRangeValidator(startKey: string, endKey: string) {
    return (group: AbstractControl) => {
      const g = group as FormGroup;
      const s = g.get(startKey)?.value;
      const e = g.get(endKey)?.value;
      if (!s || !e) return null;
      const start = new Date(s);
      const end = new Date(e);
      return start < end ? null : { dateRange: true };
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

  // ---- Conversión fecha ----
  /** Convierte ISO a valor compatible con input[type="datetime-local"] (sin zona) */
  private isoToLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  /** Toma datetime-local y devuelve ISO con 'Z' (UTC) */
  private localDatetimeToIso(local: string): string {
    // Interpreta el valor local como hora local del navegador
    const d = new Date(local);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
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

    // Construir payload conforme al API
    const payload: CampaignRequest = {
      name: v.name!,
      description: v.description!,
      type: v.type!,
      dataSources: (v.dataSources ?? []) as DataSource[],
      hashtags: (this.hashtags.value ?? []).map((s) => s.trim()),
      keywords: (this.keywords.value ?? []).map((s) => s.trim()),
      mentions: (this.mentions.value ?? []).map((s) => s.trim()),
      startDate: this.localDatetimeToIso(v.startDateLocal!),
      endDate: this.localDatetimeToIso(v.endDateLocal!),
      timezone: v.timezone!,
      maxTweets: v.maxTweets!,
      collectImages: !!v.collectImages,
      collectVideos: !!v.collectVideos,
      collectReplies: !!v.collectReplies,
      collectRetweets: !!v.collectRetweets,
      languages: v.languages ?? [],
      sentimentAnalysis: !!v.sentimentAnalysis,
      emotionAnalysis: !!v.emotionAnalysis,
      topicsAnalysis: !!v.topicsAnalysis,
      influencerAnalysis: !!v.influencerAnalysis,
      organizationId: v.organizationId!,
    };

    // Devolver el resultado con información del modo (create/edit)
    const result = {
      payload,
      mode: this.isEditModeSignal() ? 'edit' : 'create',
      id: this.campaignId(), // Será null para create, y tendrá valor para edit
    };

    this.dialogRef.close(result);
  }
}
