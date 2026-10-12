export interface StoreInfoSettings {
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  storeLogoUrl: string;
}

export interface ShippingDeliverySettings {
  standardShippingFee: number;
  freeShippingThreshold: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface NotificationPreferences {
  orderConfirmationEmail: boolean;
  orderStatusUpdateNotification: boolean;
  lowStockAlert: boolean;
  adminNewOrderAlert: boolean;
}

export interface AppSettings {
  id: string;
  store: StoreInfoSettings;
  shipping: ShippingDeliverySettings;
  notifications: NotificationPreferences;
  updatedAt?: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: '1',
  store: {
    storeName: 'SOLE//RAW',
    storeDescription: 'ARCHIVAL FOOTWEAR & PERFORMANCE SILHOUETTES // CALIBRATED UTILITY',
    contactEmail: 'admin@sole-raw.io',
    contactPhone: '+91 94007 67596',
    storeLogoUrl: '/asset/products/product1.png'
  },
  shipping: {
    standardShippingFee: 250,
    freeShippingThreshold: 10000,
    minDeliveryDays: 2,
    maxDeliveryDays: 5
  },
  notifications: {
    orderConfirmationEmail: true,
    orderStatusUpdateNotification: true,
    lowStockAlert: true,
    adminNewOrderAlert: true
  },
  updatedAt: new Date().toISOString()
};

