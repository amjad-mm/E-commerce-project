import { Routes } from '@angular/router';
import { CartComponent } from './features/cart/cart.component';
import { RegisterComponent } from './features/register/register.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrdersComponent } from './features/orders/orders.component';
import { OrderDetailsComponent } from './features/orders/order-details.component';
import { AccountComponent } from './features/account/account.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';
import { ProductViewComponent } from './features/product-view/product-view.component';
import { OrderSuccessComponent } from './features/order-success/order-success.component';
import { adminGuard } from './core/guards/admin.guard';

import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './features/admin/products/admin-products.component';
import { AdminProductFormComponent } from './features/admin/products/admin-product-form.component';

export const routes: Routes = [
	{ path: 'cart', component: CartComponent, canActivate: [authGuard] },
	{ path: 'product/:id', component: ProductViewComponent },
	{ path: 'products/:id', redirectTo: 'product/:id' },
	{ path: 'products', redirectTo: '', pathMatch: 'full' },
	{
		path: 'admin',
		component: AdminLayoutComponent,
		canActivate: [adminGuard],
		children: [
			{ path: '', component: AdminDashboardComponent, pathMatch: 'full' },
			{ path: 'products', component: AdminProductsComponent },
			{ path: 'products/add', component: AdminProductFormComponent },
			{ path: 'products/edit/:id', component: AdminProductFormComponent },
			{
				path: 'orders',
				loadComponent: () =>
					import('./features/admin/orders/admin-orders.component').then(
						(m) => m.AdminOrdersComponent
					)
			},
			{
				path: 'orders/:id',
				loadComponent: () =>
					import('./features/admin/orders/admin-order-details.component').then(
						(m) => m.AdminOrderDetailsComponent
					)
			},
			{
				path: 'users',
				loadComponent: () =>
					import('./features/admin/users/admin-users.component').then(
						(m) => m.AdminUsersComponent
					)
			},
			{ path: 'categories', redirectTo: 'products', pathMatch: 'full' },
			{ path: 'settings', redirectTo: 'products', pathMatch: 'full' }
		]
	},
	{
		path:'register',
		component:RegisterComponent,
		canActivate: [guestGuard]

	},
	{
		path:'login',
		component:LoginComponent,
		canActivate: [guestGuard]
	},
	{
		path: 'checkout',
		component: CheckoutComponent,
		canActivate: [authGuard]
	},
	{
		path: 'order-success/:id',
		component: OrderSuccessComponent,
		canActivate: [authGuard]
	},
	{
		path: 'account',
		component: AccountComponent,
		canActivate: [authGuard]
	},
	{
		path: 'profile',
		redirectTo: 'account',
		pathMatch: 'full'
	},
	{
		path: 'orders',
		component: OrdersComponent,
		canActivate: [authGuard]
	},
	{
		path: 'orders/:id',
		component: OrderDetailsComponent,
		canActivate: [authGuard]
	},
	{
		path: 'wishlist',
		component: WishlistComponent,
		canActivate: [authGuard]
	},
];
