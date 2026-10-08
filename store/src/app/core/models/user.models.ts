export interface user {
    id?: number | string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?:'customer' | 'admin'
}