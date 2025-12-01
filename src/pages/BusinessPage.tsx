
import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Star } from "lucide-react";

const BusinessPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">AgendaPro</span>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
          >
            Área do Profissional
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Image */}
        <div
          className="relative h-64 w-full bg-cover bg-center md:h-80"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1503951914875-452162b7f30a?auto=format&fit=crop&q=80&w=2070")',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Business Title Card */}
          <div className="relative z-10 -mt-16 rounded-xl border border-gray-100 bg-white p-6 shadow-lg sm:-mt-20 lg:-mt-24">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                  Barbearia do Zé
                </h1>
                <p className="mt-1 text-lg text-gray-500">
                  Corte de cabelo e barba com estilo e tradição.
                </p>
              </div>
              <Link
                to="/book"
                className="flex w-full shrink-0 items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-700 md:w-auto"
              >
                Agendar agora
              </Link>
            </div>
          </div>

          <div className="py-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* Left Column (Content) */}
              <div className="flex flex-col gap-10 lg:col-span-2">
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">
                    Sobre nós
                  </h2>
                  <p className="leading-relaxed text-gray-600">
                    Bem-vindo à Barbearia do Zé, onde a tradição encontra o estilo
                    moderno. Fundada em 2005, nossa barbearia oferece uma
                    experiência autêntica com serviços de alta qualidade. Nossos
                    barbeiros são mestres em cortes clássicos e modernos, barbas
                    bem-feitas e tratamentos capilares. Usamos apenas os melhores
                    produtos para garantir que você saia com a melhor aparência e
                    se sentindo renovado. Venha nos visitar e descubra por que
                    somos a barbearia preferida da região.
                  </p>
                </section>

                <section>
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">
                    O que nossos clientes dizem
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Review 1 */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center">
                        <img
                          src="https://picsum.photos/50/50?random=10"
                          alt="Carlos Silva"
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div className="ml-3">
                          <p className="font-bold text-gray-900">Carlos Silva</p>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        "Atendimento impecável e corte perfeito! O Zé é um mestre
                        na tesoura. Recomendo a todos."
                      </p>
                    </div>

                    {/* Review 2 */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center">
                        <img
                          src="https://picsum.photos/50/50?random=11"
                          alt="João Pereira"
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div className="ml-3">
                          <p className="font-bold text-gray-900">João Pereira</p>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4].map((s) => (
                              <Star key={s} className="h-4 w-4 fill-current" />
                            ))}
                            <Star className="h-4 w-4 fill-current text-gray-300" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        "Ambiente super agradável e profissionais excelentes. A
                        barba ficou nota 10."
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column (Info) */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">
                    Informações
                  </h3>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                      <span>Rua das Tesouras, 123, São Paulo - SP</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Phone className="h-5 w-5 shrink-0 text-primary-600" />
                      <span>(11) 98765-4321</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail className="h-5 w-5 shrink-0 text-primary-600" />
                      <span>contato@barbeariadoze.com</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                      <span>
                        Seg-Sex: 9h - 20h
                        <br />
                        Sáb: 9h - 18h
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
                  {/* Placeholder map image since we can't load real maps without API key */}
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
                    alt="Mapa da localização"
                    className="h-64 w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BusinessPage;
