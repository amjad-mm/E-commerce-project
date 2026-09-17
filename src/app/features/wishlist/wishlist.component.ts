import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CartState } from '../../core/store/cart.reducer';
import { CartService } from '../../core/service/cart.service';
import { Products } from '../../core/models/product.model';
import { WishlistService } from '../../core/service/wishlist.service';
import { WishlistState } from '../../core/store/wishlist.reducer';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  template: `
    <main class="sr-wishlist">
      <div class="sr-wishlist__inner">
      <header class="sr-wishlist__header">
        <div>
          <a class="sr-wishlist__back" routerLink="/">← RETURN TO DROPS</a>
          <div class="sr-wishlist__eyebrow"><span>[PRIVATE ARCHIVE]</span> // SAVED ALLOCATIONS</div>
          <h1>WISH<span>LIST</span></h1>
          <p>Hold the pieces you are still thinking about.</p>
        </div>
        <div class="sr-wishlist__status"><span>♥</span><div><b>ARCHIVE ACCESS</b><small>SAVED FOR YOUR NEXT MOVE</small></div></div>
      </header>

      @if (products$ | async; as products) {
        @if (products.length === 0) {
          <section class="sr-empty">
            <span class="sr-empty__mark">♥</span>
            <p class="sr-empty__code">ARCHIVE STATUS // 00 ITEMS SAVED</p>
            <h2>YOUR WISHLIST<br />IS <em>EMPTY.</em></h2>
            <p>Save pieces from the new drops and they’ll be held here for your next visit.</p>
            <a routerLink="/" class="sr-empty__action">EXPLORE NEW DROPS →</a>
          </section>
        } @else {
          <div class="sr-wishlist__meta"><span>ARCHIVE INVENTORY // {{ products.length.toString().padStart(2, '0') }} SAVED PIECES</span><span>ALL ITEMS SUBJECT TO AVAILABILITY</span></div>
          <section class="sr-wishlist__grid">
            @for (product of products; track product.id; let index = $index) {
              <article class="sr-card">
                <div class="sr-card__top"><span>INDEX [{{ (index + 1).toString().padStart(2, '0') }}]</span><span>SKU: {{ product.sku }}</span></div>
                <div class="sr-card__image">
                  <span class="sr-card__tag">{{ product.tag }}</span>
                  <button class="sr-card__remove" type="button" (click)="remove(product.id)" aria-label="Remove from wishlist">REMOVE [×]</button>
                  <img [src]="product.image" [alt]="product.name" />
                </div>
                <div class="sr-card__body">
                  <p class="sr-card__brand">{{ product.brand }} // {{ product.colorway }}</p>
                  <h2>{{ product.name }}</h2>
                  <div class="sr-card__bottom"><strong>{{ product.price | currency:'INR':'symbol':'1.0-0' }}</strong><button type="button" (click)="addToCart(product)">ADD TO BAG <span>→</span></button></div>
                </div>
              </article>
            }
          </section>
        }
      }
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-wishlist { min-height: 70vh; padding: 32px 24px 88px; background: #faf7f2; color: #111; font-family: Arial, 'Helvetica Neue', sans-serif; }
    .sr-wishlist__inner { max-width: 1400px; margin: 0 auto; }
    .sr-wishlist__header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 34px; }
    .sr-wishlist__back { display: inline-block; margin-bottom: 28px; padding-bottom: 4px; border-bottom: 1px solid #111; color: #111; font: 800 11px 'Courier New', monospace; letter-spacing: .05em; text-decoration: none; }
    .sr-wishlist__eyebrow { margin-bottom: 12px; color: #c2392a; font: 700 11px 'Courier New', monospace; letter-spacing: .06em; } .sr-wishlist__eyebrow span { margin-right: 8px; padding: 5px 9px; background: #111; color: #fff; }
    h1 { margin: 0; font-size: clamp(48px, 8vw, 86px); line-height: .82; letter-spacing: -.07em; } h1 span { color: #c9c4b6; }
    .sr-wishlist__header p { margin: 15px 0 0; font-size: 15px; }
    .sr-wishlist__status { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid #111; background: #fff; font-family: 'Courier New', monospace; } .sr-wishlist__status > span { display: grid; width: 28px; height: 28px; place-items: center; background: #d9f13d; font-size: 16px; } .sr-wishlist__status b, .sr-wishlist__status small { display: block; font-size: 10px; letter-spacing: .04em; } .sr-wishlist__status small { margin-top: 3px; color: #777; }
    .sr-wishlist__meta { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 16px; color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .04em; }
    .sr-wishlist__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
    .sr-card { overflow: hidden; border: 1px solid #111; background: #fff; box-shadow: 6px 6px 0 #111; } .sr-card__top { display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #111; color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-card__image { position: relative; background: #ece6da; } .sr-card__image img { display: block; width: 100%; aspect-ratio: .96; object-fit: cover; mix-blend-mode: multiply; }
    .sr-card__tag { position: absolute; z-index: 1; top: 10px; left: 10px; padding: 5px 8px; background: #111; color: #fff; font: 800 9px 'Courier New', monospace; letter-spacing: .04em; }
    .sr-card__remove { position: absolute; z-index: 1; top: 10px; right: 10px; border: 1px solid #111; padding: 5px 7px; background: #fff; cursor: pointer; font: 800 9px 'Courier New', monospace; letter-spacing: .02em; } .sr-card__remove:hover { background: #c2392a; color: #fff; }
    .sr-card__body { padding: 15px; } .sr-card__brand { margin: 0 0 7px; color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .03em; } .sr-card h2 { min-height: 38px; margin: 0; font-size: 18px; line-height: 1.05; text-transform: uppercase; }
    .sr-card__bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 18px; } .sr-card__bottom strong { font-size: 18px; } .sr-card__bottom button { border: 1px solid #111; padding: 9px 10px; background: #d9f13d; cursor: pointer; font: 800 10px 'Courier New', monospace; letter-spacing: .02em; } .sr-card__bottom button:hover { background: #111; color: #fff; } .sr-card__bottom button span { font-size: 14px; }
    .sr-empty { max-width: 720px; margin: 38px auto 0; padding: 58px 24px; border: 1px solid #111; background: #fff; box-shadow: 7px 7px 0 #111; text-align: center; } .sr-empty__mark { display: grid; width: 44px; height: 44px; place-items: center; margin: 0 auto 18px; background: #d9f13d; font-size: 22px; } .sr-empty__code { color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .04em; } .sr-empty h2 { margin: 14px 0; font-size: clamp(32px, 6vw, 56px); line-height: .88; letter-spacing: -.05em; } .sr-empty h2 em { color: #c9c4b6; font-style: normal; } .sr-empty > p:not(.sr-empty__code) { max-width: 400px; margin: 0 auto 25px; line-height: 1.5; } .sr-empty__action { display: inline-block; padding: 13px 16px; background: #111; color: #fff; font: 800 11px 'Courier New', monospace; letter-spacing: .04em; text-decoration: none; }
    @media (max-width: 900px) { .sr-wishlist__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 600px) { .sr-wishlist { padding: 24px 16px 64px; } .sr-wishlist__header { align-items: flex-start; flex-direction: column; } .sr-wishlist__status { width: 100%; } .sr-wishlist__meta { display: block; line-height: 1.7; } .sr-wishlist__meta span { display: block; } .sr-wishlist__grid { grid-template-columns: 1fr; gap: 20px; } }
  `]
})
export class WishlistComponent {
  private readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService);
  private readonly store = inject(Store<{ wishlist: WishlistState; cart: CartState }>);

  readonly products$ = this.wishlistService.products$;

  remove(productId: number): void {
    this.wishlistService.remove(productId);
  }

  addToCart(product: Products): void {
    this.cartService.addToCart(product);
  }
}
