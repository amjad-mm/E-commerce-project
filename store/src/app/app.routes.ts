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

export const routes: Routes = [
	{ path: 'cart', component: CartComponent, canActivate: [authGuard] },
	{ path: 'product/:id', component: ProductViewComponent },
	{ path: 'products', redirectTo: '', pathMatch: 'full' },
	{
		path: 'admin',
		component: AdminLayoutComponent,
		canActivate: [adminGuard],
		children: [
			{ path: '', component: AdminDashboardComponent, pathMatch: 'full' }
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
