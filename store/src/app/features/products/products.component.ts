
import { ProductService } from '../../core/service/product.service';
import { Products } from '../../core/models/product.model';

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductDetailsComponent } from '../product-details/product-details.component';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ProductDetailsComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
 products: Products[] = [];

 constructor(
  private readonly productService: ProductService,
  private readonly router: Router
 ) {}

 openProduct(id: number, event: MouseEvent): void {
  const clickedElement = event.target as HTMLElement;
  const clickedControl = clickedElement.closest('button, a');

  if (clickedControl) {
    return;
  }

  void this.router.navigate(['/product', id]);
 }

 ngOnInit(): void {
  this.productService.getProducts().subscribe({
    next: (data) => {
      this.products = data;
    },
    error: (error) => {
      console.log('error loading products', error);
    }
  });
 }
}
