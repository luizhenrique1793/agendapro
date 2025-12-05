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
  reminder_sent?: boolean;
}

export interface BusinessStats {
  appointmentsToday: number;
  revenueMonth: number;
  totalClients: number;
  growth: number;
}

export interface EvolutionApiConfig {
  serverUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface AddressDetails {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  website?: string;
  whatsapp?: string;
}

// Configuração do Agente IA para WhatsApp
export interface AssistantConfig {
  active: boolean; // Se o bot deve responder ou não
  identity: {
    name: string; // Nome do agente (ex: Luna)
    tone: string; // Tom de voz (ex: formal, descolado)
    description: string; // Breve descrição da persona
  };
  messages: {
    welcome_new: string; // Saudação para novos contatos
    welcome_existing: string; // Saudação para clientes recorrentes
    confirmation_booking: string; // Mensagem de sucesso ao agendar
    confirmation_reschedule: string; // Mensagem de sucesso ao reagendar
    confirmation_cancellation: string; // Mensagem de sucesso ao cancelar
    no_slots: string; // Quando não há horários
    service_unavailable: string; // Serviço não encontrado/indisponível
    professional_unavailable: string; // Profissional não encontrado
  };
  persuasion: {
    benefits: string; // Lista de benefícios do negócio
    extra_phrases: string; // Frases de efeito para usar
  };
  behavior: {
    ask_if_new_client: boolean; // Perguntar se já é cliente?
    search_by_phone: boolean; // Buscar histórico pelo WhatsApp?
    show_services_first: boolean; // Listar serviços logo no início?
    require_confirmation: boolean; // Pedir "Sim" antes de executar ação?
    persuasive_mode: boolean; // Ativar modo de vendas mais agressivo?
  };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  status: "Ativo" | "Inativo";
  phone?: string;
  secondary_phone?: string;
  address?: string; // Mantido para compatibilidade, mas o foco será address_details
  address_details?: AddressDetails;
  description?: string;
  photos?: string[];
  payment_methods?: string[];
  social_media?: SocialMedia;
  working_hours?: {
    day: string;
    intervals: { start: string; end: string }[];
    active: boolean;
  }[];
  evolution_api_config?: EvolutionApiConfig;
  automatic_reminders?: boolean;
  assistant_config?: AssistantConfig; // Nova configuração do Agente IA
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