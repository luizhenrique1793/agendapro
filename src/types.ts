export enum AppointmentStatus {
  PENDING = "Pendente",
  CONFIRMED = "Confirmado",
  COMPLETED = "Concluído",
  CANCELLED = "Cancelado",
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description?: string;
  business_id?: string;
}

export interface Professional {
  id: string;
  name: string;
  role?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  business_id?: string;
  schedule?: {
    day: string;
    intervals: { start: string; end: string }[];
    active: boolean;
  }[];
}

export interface ProfessionalBlock {
  id: string;
  professionalId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  lastVisit?: string;
  status: "Ativo" | "Inativo";
  notes?: string;
  business_id?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  professionalId: string;
  business_id?: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface BusinessStats {
  appointmentsToday: number;
  revenueMonth: number;
  totalClients: number;
  growth: number;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  status: "Ativo" | "Inativo";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Dono" | "Profissional";
  businessId?: string; // Optional if Admin
  businessName?: string;
  status: "Ativo" | "Inativo";
}