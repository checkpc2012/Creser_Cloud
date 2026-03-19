export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string; // DNI, Cédula, etc.
  address: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export type NewClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
