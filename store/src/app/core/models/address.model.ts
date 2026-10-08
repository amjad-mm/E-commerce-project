export interface Address {
  id: string;
  userId?: string | number;
  userEmail: string;
  type: 'home' | 'office';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

