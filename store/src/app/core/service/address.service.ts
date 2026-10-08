import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/addresses';

  getAddresses(userEmail: string): Observable<Address[]> {
    if (!userEmail) {
      return of([]);
    }
    return this.http.get<Address[]>(this.apiUrl, {
      params: { userEmail }
    });
  }

  addAddress(address: Address): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, address);
  }

  updateAddress(id: string, address: Partial<Address>): Observable<Address> {
    return this.http.patch<Address>(`${this.apiUrl}/${id}`, address);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setDefaultAddress(targetId: string, userEmail: string): Observable<Address[]> {
    return this.getAddresses(userEmail).pipe(
      switchMap((addresses) => {
        const updates = addresses.map((addr) => {
          const isTarget = addr.id === targetId;
          if (addr.isDefault !== isTarget) {
            return this.updateAddress(addr.id, { isDefault: isTarget });
          }
          return of(addr);
        });
        return updates.length > 0 ? forkJoin(updates) : of([]);
      })
    );
  }
}

