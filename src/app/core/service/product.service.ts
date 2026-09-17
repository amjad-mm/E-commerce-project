import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Products } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/products';

  getProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<Products> {
    return this.http.get<Products>(`${this.apiUrl}/${id}`);
  }
}