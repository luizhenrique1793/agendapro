import React, { createContext, useContext, useState, useEffect } from "react";
import { Service, Professional, Appointment, Business, User, Client, ProfessionalBlock, AppointmentStatus } from "./types";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";

interface AppContextType {
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  businesses: Business[];
  users: User[];
  clients: Client[];
  loading: boolean;
  currentBusiness: Business | null;
  updateBusiness: (business: Partial<Business>) => Promise<void>;
  addAppointment: (appt: Omit<Appointment, "id" | "created_at">) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  completeAppointment: (id: string, paymentMethod: string, amountPaid: number) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<void>;
  addService: (service: Omit<Service, "id">, linkedProfessionalIds?: string[]) => Promise<void>;
  updateService: (service: Service, linkedProfessionalIds?: string[]) => Promise<void>;
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
  fetchServiceProfessionals: (serviceId: string) => Promise<string[]>;
  isAuthenticated: boolean;
  logout: () => void;
  googleCalendarConnected: boolean;
  toggleGoogleCalendar: () => void;
  sendDailyReminders: () => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);

  const { user, role, signOut } = useAuth();
  const isAuthenticated = !!user;
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setServices([]);
      setProfessionals([]);
      setAppointments([]);
      setBusinesses([]);
      setUsers([]);
      setClients([]);
      setCurrentBusiness(null);
      setLoading(false);
    }
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let businessId: string | null = null;

      if (role === 'admin') {
        const { data } = await supabase.from('businesses').select('*');
        setBusinesses(data || []);
      } else if (user) {
        const { data: userData } = await supabase.from('users').select('business_id').eq('id', user.id).single();
        if (userData?.business_id) {
          businessId = userData.business_id;
          const { data: businessData } = await supabase.from('businesses').select('*').eq('id', businessId).single();
          setCurrentBusiness(businessData || null);
        }
      }

      if (businessId) {
        const { data: servicesData } = await supabase.from('services').select('*').eq('business_id', businessId);
        setServices(servicesData || []);
        const { data: prosData } = await supabase.from('professionals').select('*').eq('business_id', businessId);
        setProfessionals(prosData || []);
        const { data: apptsData } = await supabase.from('appointments').select('*').eq('business_id', businessId);
        setAppointments(apptsData || []);
        const { data: clientsData } = await supabase.from('clients').select('*').eq('business_id', businessId);
        setClients(clientsData || []);
      } else if (role !== 'admin') {
        setServices([]);
        setProfessionals([]);
        setAppointments([]);
        setClients([]);
        setCurrentBusiness(null);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const updateBusiness = async (businessUpdate: Partial<Business>) => {
    if (!currentBusiness?.id) throw new Error("Negócio não identificado.");
    
    // Atualiza o campo de lembretes automáticos no banco de dados
    const { error, count } = await supabase
      .from('businesses')
      .update(businessUpdate)
      .eq('id', currentBusiness.id)
      .select('id', { count: 'exact' }); 

    if (error) throw error;
    
    if (count === 0) {
        throw new Error("Nenhum registro foi atualizado. Verifique suas permissões (RLS) ou se o negócio ainda existe.");
    }

    await fetchData();
  };

  const updateServiceProfessionals = async (serviceId: string, professionalIds: string[]) => {
    if (!currentBusiness?.id) return;

    // 1. Delete existing
    const { error: deleteError } = await supabase
        .from('service_professionals')
        .delete()
        .eq('service_id', serviceId);
    
    if (deleteError) throw deleteError;

    // 2. Insert new
    if (professionalIds.length > 0) {
        const toInsert = professionalIds.map(pid => ({
            service_id: serviceId,
            professional_id: pid,
            business_id: currentBusiness.id
        }));
        const { error: insertError } = await supabase
            .from('service_professionals')
            .insert(toInsert);
        
        if (insertError) throw insertError;
    }
  };

  const addService = async (service: Omit<Service, "id">, linkedProfessionalIds?: string[]) => {
    if (!currentBusiness?.id) throw new Error("Negócio não identificado.");
    
    const { data, error } = await supabase
        .from('services')
        .insert([{ ...service, business_id: currentBusiness.id }])
        .select()
        .single();
    
    if (error) throw error;

    if (linkedProfessionalIds) {
        await updateServiceProfessionals(data.id, linkedProfessionalIds);
    }
    
    fetchData();
  };

  const updateService = async (updatedService: Service, linkedProfessionalIds?: string[]) => {
    const { error } = await supabase.from('services').update(updatedService).eq('id', updatedService.id);
    if (error) throw error;

    if (linkedProfessionalIds) {
        await updateServiceProfessionals(updatedService.id, linkedProfessionalIds);
    }

    fetchData();
  };

  const fetchServiceProfessionals = async (serviceId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('service_professionals')
        .select('professional_id')
        .eq('service_id', serviceId);
    
    if (error) {
        console.error("Error fetching linked professionals:", error);
        return [];
    }
    return data.map(item => item.professional_id);
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    fetchData();
  };

  const addProfessional = async (professional: Omit<Professional, "id">) => {
    if (!currentBusiness?.id) throw new Error("Negócio não identificado.");
    const { error } = await supabase.from('professionals').insert([{ ...professional, business_id: currentBusiness.id }]);
    if (error) throw error;
    fetchData();
  };

  const updateProfessional = async (professional: Professional) => {
    const { error } = await supabase.from('professionals').update(professional).eq('id', professional.id);
    if (error) throw error;
    fetchData();
  };

  const deleteProfessional = async (id: string) => {
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw error;
    fetchData();
  };

  const uploadProfessionalAvatar = async (file: File): Promise<string> => {
    if (!file) {
      throw new Error("Nenhum arquivo selecionado.");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('professional-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('professional-avatars')
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("Não foi possível obter a URL pública do avatar.");
    }

    return data.publicUrl;
  };

  const addProfessionalBlock = async (block: Omit<ProfessionalBlock, "id">) => {
    if (!currentBusiness?.id) throw new Error("Negócio não identificado.");
    const { error } = await supabase.from('professional_blocks').insert([{ ...block, business_id: currentBusiness.id }]);
    if (error) throw error;
  };

  const addAppointment = async (appt: Omit<Appointment, "id" | "created_at">) => {
    if (!currentBusiness?.id) throw new Error("Negócio não identificado.");
    const { error } = await supabase.from('appointments').insert([{ ...appt, business_id: currentBusiness.id }]);
    if (error) throw error;
    await fetchData();
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const completeAppointment = async (id: string, paymentMethod: string, amountPaid: number) => {
    const { error } = await supabase
      .from('appointments')
      .update({
        status: AppointmentStatus.COMPLETED,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const rescheduleAppointment = async (id: string, newDate: string, newTime: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ date: newDate, time: newTime, status: AppointmentStatus.PENDING })
      .eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const sendDailyReminders = async () => {
    const { data, error } = await supabase.functions.invoke('send-appointment-reminders', {});
    if (error) throw error;
    return data;
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
        currentBusiness,
        logout,
        updateBusiness,
        addService,
        updateService,
        deleteService,
        addProfessional,
        updateProfessional,
        deleteProfessional,
        addAppointment,
        updateAppointmentStatus,
        completeAppointment,
        rescheduleAppointment,
        uploadProfessionalAvatar,
        addUser: () => { console.log("addUser called"); },
        addClient: () => { console.log("addClient called"); },
        updateClient: () => { console.log("updateClient called"); },
        deleteClient: () => { console.log("deleteClient called"); },
        addProfessionalBlock,
        removeProfessionalBlock: async () => { console.log("removeProfessionalBlock called"); },
        fetchProfessionalBlocks: async () => { console.log("fetchProfessionalBlocks called"); return []; },
        fetchServiceProfessionals,
        isAuthenticated,
        googleCalendarConnected,
        toggleGoogleCalendar: () => setGoogleCalendarConnected(!googleCalendarConnected),
        sendDailyReminders,
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