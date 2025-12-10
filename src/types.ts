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

// Nova interface para configurações de lembretes
export interface ReminderConfig {
  same_day_enabled: boolean;
  same_day_hours_before: number;
  previous_day_enabled: boolean;
  early_threshold_hour: string; // formato HH:MM
  previous_day_time: string; // formato HH:MM
}