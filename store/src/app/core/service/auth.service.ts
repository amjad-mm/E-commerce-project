import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { user } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  register(user: user): Observable<user> {
    return this.http.get<user[]>(this.apiUrl, {
      params: { email: user.email }
    }).pipe(
      switchMap((users) => {
        if (users.length > 0) {
          return throwError(() => ({ status: 409 }));
        }

        return this.http.post<user>(this.apiUrl, user);
      })
    );
  }
  
  login(email: string, password: string): Observable<user[]> {
    return this.http.get<user[]>(this.apiUrl, {
      params: { email }
    }).pipe(
      map((users) => users.filter((currentUser) => {
        return currentUser.password === password;
      }))
    );
  }

  updateUser(id: string | number, updatedData: Partial<user>): Observable<user> {
    return this.http.patch<user>(`${this.apiUrl}/${id}`, updatedData);
  }

  getUserByEmail(email: string): Observable<user | null> {
    return this.http.get<user[]>(this.apiUrl, {
      params: { email }
    }).pipe(
      map((users) => (users.length > 0 ? users[0] : null))
    );
  }

  getAllUsers(): Observable<user[]> {
    return this.http.get<user[]>(this.apiUrl);
  }
}
