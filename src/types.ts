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
  avatar_url?: string;
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
  clientId?: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  professional_id: string;
  business_id?: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  payment_method?: string;
  amount_paid?: number;
  paid_at?: string;
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
  phone?: string;
  address?: string;
  working_hours?: {
    day: string;
    intervals: { start: string; end: string }[];
    active: boolean;
  }[];
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