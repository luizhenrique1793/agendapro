import { Service, Professional, Appointment, AppointmentStatus, Business, User, Client } from "./types";

export const MOCK_SERVICES: Service[] = [
  {
    id: "1",
    name: "Corte de Cabelo Masculino",
    duration: 30,
    price: 35.0,
    category: "Cabelo",
  },
  {
    id: "2",
    name: "Barba Completa",
    duration: 30,
    price: 25.0,
    category: "Barba",
  },
  {
    id: "3",
    name: "Combo (Corte + Barba)",
    duration: 50,
    price: 55.0,
    category: "Combo",
  },
  {
    id: "4",
    name: "Acabamento / Pezinho",
    duration: 15,
    price: 15.0,
    category: "Cabelo",
  },
];

export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: "1",
    name: "João Silva",
    role: "Barbeiro Senior",
    email: "joao@agendapro.com",
    avatarUrl: "https://picsum.photos/100/100?random=1",
  },
  {
    id: "2",
    name: "Pedro Souza",
    role: "Barbeiro",
    email: "pedro@agendapro.com",
    avatarUrl: "https://picsum.photos/100/100?random=2",
  },
  {
    id: "3",
    name: "Carlos Santos",
    role: "Especialista em Barba",
    email: "carlos@agendapro.com",
    avatarUrl: "https://picsum.photos/100/100?random=3",
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Ricardo Oliveira",
    email: "ricardo@email.com",
    phone: "(11) 99999-9999",
    totalVisits: 12,
    lastVisit: "2024-03-10",
    status: "Ativo",
  },
  {
    id: "c2",
    name: "Fernando Dias",
    email: "fernando@email.com",
    phone: "(11) 98888-8888",
    totalVisits: 5,
    lastVisit: "2024-02-28",
    status: "Ativo",
  },
  {
    id: "c3",
    name: "Ana Clara",
    email: "ana@email.com",
    phone: "(11) 97777-7777",
    totalVisits: 3,
    lastVisit: "2024-01-15",
    status: "Inativo",
  },
  {
    id: "c4",
    name: "Bruno Lima",
    email: "bruno@email.com",
    phone: "(11) 96666-6666",
    totalVisits: 8,
    lastVisit: "2024-03-12",
    status: "Ativo",
  },
  {
    id: "c5",
    name: "Carla Mendes",
    email: "carla@email.com",
    phone: "(11) 95555-5555",
    totalVisits: 1,
    lastVisit: "2023-12-20",
    status: "Inativo",
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "101",
    clientId: "c1",
    cliente_name: "Ricardo Oliveira",
    cliente_phone: "(11) 99999-9999",
    service_id: "3",
    professional_id: "1",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    status: AppointmentStatus.CONFIRMED,
    created_at: new Date().toISOString(),
  },
  {
    id: "102",
    clientId: "c2",
    cliente_name: "Fernando Dias",
    cliente_phone: "(11) 98888-8888",
    service_id: "1",
    professional_id: "2",
    date: new Date().toISOString().split("T")[0],
    time: "14:30",
    status: AppointmentStatus.PENDING,
    created_at: new Date().toISOString(),
  },
  {
    id: "103",
    clientId: "c3",
    cliente_name: "Ana Clara",
    cliente_phone: "(11) 97777-7777",
    service_id: "1", // Assuming simple cut
    professional_id: "1",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    status: AppointmentStatus.COMPLETED,
    created_at: new Date().toISOString(),
  },
];

export const MOCK_BUSINESSES: Business[] = [
  {
    id: "1",
    name: "Barbearia do Zé",
    type: "Barbearia",
    city: "São Paulo",
    status: "Ativo",
  },
  {
    id: "2",
    name: "Salão Bela Mulher",
    type: "Salão de Beleza",
    city: "Rio de Janeiro",
    status: "Ativo",
  },
  {
    id: "3",
    name: "Clínica Sorriso",
    type: "Clínica",
    city: "Belo Horizonte",
    status: "Inativo",
  },
  {
    id: "4",
    name: "Estética Pele Fina",
    type: "Clínica",
    city: "Curitiba",
    status: "Ativo",
  },
  {
    id: "5",
    name: "Corte & Estilo",
    type: "Barbearia",
    city: "Porto Alegre",
    status: "Inativo",
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@example.com",
    role: "Dono",
    businessName: "Barbearia do Zé",
    status: "Ativo",
  },
  {
    id: "2",
    name: "Maria Oliveira",
    email: "maria.oliveira@example.com",
    role: "Profissional",
    businessName: "Salão da Maria",
    status: "Ativo",
  },
  {
    id: "3",
    name: "Carlos Pereira",
    email: "carlos.pereira@example.com",
    role: "Admin",
    businessName: "-",
    status: "Inativo",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@example.com",
    role: "Profissional",
    businessName: "Clínica Sorriso",
    status: "Ativo",
  },
  {
    id: "5",
    name: "Pedro Martins",
    email: "pedro.martins@example.com",
    role: "Profissional",
    businessName: "Barbearia do Zé",
    status: "Ativo",
  },
];