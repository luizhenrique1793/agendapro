
import React, { createContext, useContext, useState, useEffect } from "react";
import { Service, Professional, Appointment, Business, User, Client, ProfessionalBlock } from "./types";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import {
  MOCK_BUSINESSES,
  MOCK_USERS,
  MOCK_CLIENTS
} from "./constants";

interface AppContextType {
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  businesses: Business[];
  users: User[];
  clients: Client[];
  loading: boolean;
  addAppointment: (appt: Omit<Appointment, "id" | "createdAt">) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<void>;
  addService: (service: Omit<Service, "id">) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addProfessional: (professional: Omit<Professional, "id">) => Promise<void>;
  updateProfessional: (professional: Professional) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  uploadProfessionalAvatar: (file: File) => Promise<string>;
  addUser: (user: User) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addProfessionalBlock: (block: Omit<ProfessionalBlock, "id">) => Promise<void>;
  removeProfessionalBlock: (id: string) => Promise<void>;
  fetchProfessionalBlocks: (professionalId: string) => Promise<ProfessionalBlock[]>;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  googleCalendarConnected: boolean;
  toggleGoogleCalendar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  // Fetch data on mount
  // Fetch data when user changes
  useEffect(() => {
    let servicesSub: any;
    let prosSub: any;
    let apptsSub: any;

    if (user) {
      fetchData();

      // Subscribe to changes
      servicesSub = supabase
        .channel('services')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchData)
        .subscribe();

      prosSub = supabase
        .channel('professionals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'professionals' }, fetchData)
        .subscribe();

      apptsSub = supabase
        .channel('appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchData)
        .subscribe();
    } else {
      // Clear data on logout
      setServices([]);
      setProfessionals([]);
      setAppointments([]);
    }

    return () => {
      if (servicesSub) supabase.removeChannel(servicesSub);
      if (prosSub) supabase.removeChannel(prosSub);
      if (apptsSub) supabase.removeChannel(apptsSub);
    };
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: servicesData } = await supabase.from('services').select('*');
      if (servicesData) setServices(servicesData);

      const { data: prosData } = await supabase.from('professionals').select('*');
      if (prosData) setProfessionals(prosData);

      const { data: apptsData } = await supabase.from('appointments').select('*');
      if (apptsData) setAppointments(apptsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock checking local storage
  useEffect(() => {
    const gCal = localStorage.getItem("googleCalendar");
    if (gCal === "true") setGoogleCalendarConnected(true);
  }, []);

  const login = () => {
    // Login is handled by Supabase Auth in Login component
  };

  const logout = async () => {
    await signOut();
    localStorage.removeItem("auth");
  };

  const addAppointment = async (appt: Omit<Appointment, "id" | "createdAt">) => {
    // For now, we'll assume a default business_id if not present, or handle it in the backend trigger
    // Since we don't have a business context yet in the booking flow, we might need to fetch a default one or pass it
    // For this implementation, let's assume the first business in the DB or a hardcoded one for the demo
    // In a real multi-tenant app, the booking URL would contain the business slug/ID

    // Fetch a business ID to associate with (temporary fix until full multi-tenant context)
    const { data: business } = await supabase.from('businesses').select('id').limit(1).single();
    const businessId = business?.id;

    const { clientId, ...appointmentData } = appt;

    const { error } = await supabase.from('appointments').insert([{
      ...appointmentData,
      business_id: businessId,
      status: 'Pendente'
    }]);

    if (error) throw error;
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  };

  const rescheduleAppointment = async (id: string, newDate: string, newTime: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ date: newDate, time: newTime })
      .eq('id', id);

    if (error) throw error;
  };

  const addService = async (service: Omit<Service, "id">) => {
    console.log("addService called, user:", user);

    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    console.log("Fetching profile for user ID:", user.id);

    // Get current user's business from their user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single();

    console.log("User fetch result:", { userRecord, userError });

    if (userError) {
      console.error("Error fetching user record:", userError);
      throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
    }

    if (!userRecord?.business_id) {
      console.error("User has no business_id:", userRecord);
      throw new Error("Usuário não está associado a nenhum negócio. Entre em contato com o administrador.");
    }

    console.log("Inserting service with business_id:", userRecord.business_id);

    const { error } = await supabase.from('services').insert([{
      ...service,
      business_id: userRecord.business_id
    }]);

    if (error) {
      console.error("Error inserting service:", error);
      throw error;
    }

    console.log("Service inserted successfully");
    fetchData();
  };

  const updateService = async (updatedService: Service) => {
    const { error } = await supabase
      .from('services')
      .update(updatedService)
      .eq('id', updatedService.id);

    if (error) throw error;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const addProfessional = async (professional: Omit<Professional, "id">) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    // Get current user's business from their user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error("Error fetching user record:", userError);
      throw new Error("Erro ao buscar dados do usuário");
    }

    if (!userRecord?.business_id) {
      throw new Error("Usuário não está associado a nenhum negócio. Entre em contato com o administrador.");
    }

    const { error } = await supabase.from('professionals').insert([{
      ...professional,
      business_id: userRecord.business_id
    }]);

    if (error) throw error;
    fetchData();
  };

  const updateProfessional = async (professional: Professional) => {
    const { error } = await supabase
      .from('professionals')
      .update(professional)
      .eq('id', professional.id);

    if (error) throw error;
    fetchData();
  };

  const deleteProfessional = async (id: string) => {
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    fetchData();
  };

  const addProfessionalBlock = async (block: Omit<ProfessionalBlock, "id">) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    const { data: userRecord } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (!userRecord?.business_id) throw new Error("Negócio não encontrado");

    const { error } = await supabase.from('professional_blocks').insert([{
      professional_id: block.professionalId,
      business_id: userRecord.business_id,
      start_date: block.startDate,
      end_date: block.endDate,
      start_time: block.startTime,
      end_time: block.endTime,
      reason: block.reason
    }]);

    if (error) throw error;
  };

  const removeProfessionalBlock = async (id: string) => {
    const { error } = await supabase
      .from('professional_blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const fetchProfessionalBlocks = async (professionalId: string) => {
    const { data, error } = await supabase
      .from('professional_blocks')
      .select('*')
      .eq('professional_id', professionalId);

    if (error) throw error;

    // Map database fields to TypeScript interface
    return (data || []).map(block => ({
      id: block.id,
      professionalId: block.professional_id,
      startDate: block.start_date,
      endDate: block.end_date,
      startTime: block.start_time,
      endTime: block.end_time,
      reason: block.reason
    })) as ProfessionalBlock[];
  };

  const uploadProfessionalAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('professional-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('professional-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const addUser = (user: User) => {
    setUsers((prev) => [user, ...prev]);
  };

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleGoogleCalendar = () => {
    const newState = !googleCalendarConnected;
    setGoogleCalendarConnected(newState);
    localStorage.setItem("googleCalendar", String(newState));
  };

  return (
    <AppContext.Provider
      value={{
        services,
        professionals,
        appointments,
        businesses,
        users,
        clients,
        loading,
        addAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        addService,
        updateService,
        deleteService,
        addProfessional,
        updateProfessional,
        deleteProfessional,
        uploadProfessionalAvatar,
        addUser,
        addClient,
        updateClient,
        deleteClient,
        addProfessionalBlock,
        removeProfessionalBlock,
        fetchProfessionalBlocks,
        isAuthenticated,
        login,
        logout,
        googleCalendarConnected,
        toggleGoogleCalendar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
