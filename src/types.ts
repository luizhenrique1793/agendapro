export interface ReminderConfig {
  same_day_enabled: boolean; // Se deve enviar lembretes no mesmo dia
  previous_day_time: string; // Horário para enviar no dia anterior (ex: "19:00")
  early_threshold_hour: string; // Horário limite para considerar "muito cedo" (ex: "09:00")
  previous_day_enabled: boolean; // Se deve enviar lembretes no dia anterior
  same_day_hours_before: number; // Quantas horas antes no mesmo dia
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
  reminder_config?: ReminderConfig; // Nova configuração de lembretes
}