import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PendingTweetService {
  pending = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

    /**
     * Carga la cantidad de tweets pendientes de procesar.
     * Utiliza el servicio HTTP para obtener los datos y actualiza las señales correspondientes.
     */
  loadPending() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<any[]>('/tweets/unprocessed').subscribe({
      next: (data) => {
        this.pending.set(Array.isArray(data) ? data.length : 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los tweets pendientes');
        this.loading.set(false);
      }
    });
  }
}
