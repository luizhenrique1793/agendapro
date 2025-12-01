import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Menu,
  X,
  Star,
  Check,
} from "lucide-react";

const Landing: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">AgendaFlow</span>
          </div>

          <nav className="hidden gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary-600">
              Funcionalidades
            </a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary-600">
              Depoimentos
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary-600">
              Preços
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Login
            </Link>
            <Link
              to="/book"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Ver Demo Agendamento
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-gray-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-base font-medium text-gray-700">
                Funcionalidades
              </a>
              <Link to="/login" className="text-base font-medium text-gray-700">
                Login
              </Link>
              <Link
                to="/book"
                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Ver Demo
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="max-w-2xl text-center lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                  Simplifique a gestão e o agendamento do seu negócio
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  AgendaFlow é a solução completa para otimizar seus agendamentos,
                  gerenciar clientes e impulsionar o crescimento do seu negócio.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                  <Link
                    to="/login"
                    className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Começar Agora
                  </Link>
                  <Link
                    to="/book"
                    className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
                  >
                    Agendar Horário <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3"
                  alt="App Screenshot"
                  className="rounded-2xl shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">
                Tudo em um só lugar
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ferramentas para fazer seu negócio crescer
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Calendar,
                  title: "Agenda Inteligente",
                  desc: "Evite conflitos e buracos na agenda com nosso sistema inteligente.",
                },
                {
                  icon: Clock,
                  title: "Lembretes Automáticos",
                  desc: "Reduza faltas enviando lembretes automáticos por WhatsApp e E-mail.",
                },
                {
                  icon: TrendingUp,
                  title: "Gestão Financeira",
                  desc: "Acompanhe suas receitas, despesas e comissões em tempo real.",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-semibold leading-8 text-primary-600">Depoimentos</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Quem usa, recomenda
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  body: "O AgendaFlow revolucionou a forma como organizo minha barbearia. As faltas diminuíram em 80%!",
                  author: {
                    name: "Roberto Almeida",
                    handle: "Barbearia do Beto",
                    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  },
                },
                {
                  body: "Simples de usar e muito eficiente. Meus clientes adoram poder agendar sozinhos pelo link.",
                  author: {
                    name: "Carla Dias",
                    handle: "Studio Carla Dias",
                    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  },
                },
                {
                  body: "Os relatórios financeiros me ajudaram a entender onde eu estava gastando demais. Indispensável.",
                  author: {
                    name: "Marcos Souza",
                    handle: "Clínica Saúde & Bem-estar",
                    imageUrl: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  },
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="flex flex-col justify-between bg-white p-6 shadow-lg ring-1 ring-gray-900/5 rounded-2xl">
                  <div className="flex gap-x-4 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                  </div>
                  <blockquote className="text-gray-900">
                    <p>"{testimonial.body}"</p>
                  </blockquote>
                  <div className="mt-6 flex items-center gap-x-4">
                    <img className="h-10 w-10 rounded-full bg-gray-50" src={testimonial.author.imageUrl} alt="" />
                    <div>
                      <div className="font-semibold">{testimonial.author.name}</div>
                      <div className="text-gray-600">{testimonial.author.handle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Planos simples e transparentes</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Escolha o plano ideal para o tamanho do seu negócio. Cancele quando quiser.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: "Básico",
                  price: "R$ 49",
                  frequency: "/mês",
                  description: "Essencial para profissionais autônomos.",
                  features: [
                    "Agenda Online",
                    "Até 100 agendamentos/mês",
                    "Link de agendamento personalizado",
                    "Lembretes por E-mail",
                  ],
                  cta: "Começar Grátis",
                  featured: false,
                },
                {
                  name: "Profissional",
                  price: "R$ 89",
                  frequency: "/mês",
                  description: "Perfeito para salões e clínicas em crescimento.",
                  features: [
                    "Tudo do Básico",
                    "Agendamentos ilimitados",
                    "Lembretes por WhatsApp",
                    "Gestão Financeira",
                    "Múltiplos Profissionais (até 3)",
                  ],
                  cta: "Começar Grátis",
                  featured: true,
                },
                {
                  name: "Empresarial",
                  price: "R$ 149",
                  frequency: "/mês",
                  description: "Para grandes redes e franquias.",
                  features: [
                    "Tudo do Profissional",
                    "Profissionais Ilimitados",
                    "Múltiplas Unidades",
                    "API de Integração",
                    "Suporte Prioritário",
                  ],
                  cta: "Falar com Vendas",
                  featured: false,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 xl:p-10 ${
                    tier.featured
                      ? "ring-2 ring-primary-600 shadow-xl relative scale-105"
                      : "ring-gray-200 shadow-sm"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-sm font-semibold leading-6 text-white">
                      Mais Popular
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-x-4">
                      <h3 className="text-lg font-semibold leading-8 text-gray-900">
                        {tier.name}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {tier.description}
                    </p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-gray-900">
                        {tier.price}
                      </span>
                      <span className="text-sm font-semibold leading-6 text-gray-600">
                        {tier.frequency}
                      </span>
                    </p>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <Check className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href="#"
                    className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      tier.featured
                        ? "bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600"
                        : "bg-primary-50 text-primary-600 hover:bg-primary-100"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-100 pt-8 md:flex md:items-center md:justify-between">
            <p className="text-xs text-gray-500">
              &copy; 2024 AgendaFlow. Todos os direitos reservados.
            </p>
            <div className="mt-4 flex space-x-6 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Termos
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;