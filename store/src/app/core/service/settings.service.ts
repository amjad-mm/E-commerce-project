import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/settings';

  private readonly settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_APP_SETTINGS);
  readonly settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadInitialSettings();
  }

  get currentSettings(): AppSettings {
    return this.settingsSubject.getValue();
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings[] | AppSettings>(this.apiUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res.length > 0 ? this.mergeWithDefaults(res[0]) : DEFAULT_APP_SETTINGS;
        }
        if (res && typeof res === 'object') {
          return this.mergeWithDefaults(res);
        }
        return DEFAULT_APP_SETTINGS;
      }),
      catchError((error) => {
        console.warn('[SettingsService] Failed to fetch settings from server, using local fallback:', error);
        return of(this.currentSettings || DEFAULT_APP_SETTINGS);
      }),
      tap((settings) => {
        this.settingsSubject.next(settings);
      })
    );
  }

  updateSettings(updatedPayload: Partial<AppSettings>): Observable<AppSettings> {
    const current = this.currentSettings;
    const merged: AppSettings = {
      ...current,
      ...updatedPayload,
      id: current.id || '1',
      store: {
        ...current.store,
        ...(updatedPayload.store || {})
      },
      shipping: {
        ...current.shipping,
        ...(updatedPayload.shipping || {})
      },
      notifications: {
        ...current.notifications,
        ...(updatedPayload.notifications || {})
      },
      updatedAt: new Date().toISOString()
    };

    // json-server supports PUT/PATCH at /settings/:id
    return this.http.put<AppSettings>(`${this.apiUrl}/${merged.id}`, merged).pipe(
      catchError((error) => {
        console.warn('[SettingsService] PUT failed, attempting PATCH:', error);
        return this.http.patch<AppSettings>(`${this.apiUrl}/${merged.id}`, merged).pipe(
          catchError((patchErr) => {
            console.error('[SettingsService] Remote update failed, retaining local state:', patchErr);
            // Return merged so optimistic update can still take effect
            return of(merged);
          })
        );
      }),
      tap((savedSettings) => {
        const full = this.mergeWithDefaults(savedSettings);
        this.settingsSubject.next(full);
      })
    );
  }

  private loadInitialSettings(): void {
    this.getSettings().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private mergeWithDefaults(incoming: Partial<AppSettings>): AppSettings {
    return {
      id: incoming.id || DEFAULT_APP_SETTINGS.id,
      store: {
        ...DEFAULT_APP_SETTINGS.store,
        ...(incoming.store || {})
      },
      shipping: {
        ...DEFAULT_APP_SETTINGS.shipping,
        ...(incoming.shipping || {})
      },
      notifications: {
        ...DEFAULT_APP_SETTINGS.notifications,
        ...(incoming.notifications || {})
      },
      updatedAt: incoming.updatedAt || new Date().toISOString()
    };
  }
}

