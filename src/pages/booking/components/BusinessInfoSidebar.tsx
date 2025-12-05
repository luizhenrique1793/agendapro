import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Facebook,
  Globe,
  Share2,
  MessageCircle,
  CreditCard,
  Copy,
  Check,
  Map
} from "lucide-react";
import { Business } from "../../../types";

interface BusinessInfoSidebarProps {
  business: Business;
}

export const BusinessInfoSidebar: React.FC<BusinessInfoSidebarProps> = ({ business }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const ad = business.address_details;
  const fullAddress = ad
    ? `${ad.street}, ${ad.number}${ad.complement ? ' - ' + ad.complement : ''}, ${ad.neighborhood}, ${ad.city} - ${ad.state}`
    : business.address || "Endereço não informado";

  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  
  const todayWeekDay = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Location Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Localização e Contato</h3>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <span className="text-gray-600 text-sm">{fullAddress}</span>
          </div>
          {business.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary-600 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">{business.phone}</span>
                <button
                  onClick={() => copyToClipboard(business.phone!)}
                  className="text-gray-400 hover:text-green-500"
                  title="Copiar"
                >
                  {copiedPhone ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}
          {business.secondary_phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary-600 shrink-0" />
              <span className="text-gray-600 text-sm">{business.secondary_phone}</span>
            </div>
          )}
        </div>

        <a
          href={googleMapsLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors gap-2"
        >
          <Map className="h-4 w-4" /> Ver no Mapa
        </a>
      </div>

      {/* Hours Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Horário de Funcionamento</h3>
        <ul className="space-y-3 text-sm">
          {(business.working_hours || []).map((day) => {
            const isToday = capitalize(todayWeekDay).includes(day.day);
            return (
              <li
                key={day.day}
                className={`flex justify-between items-center ${
                  isToday
                    ? "font-bold text-gray-900 bg-gray-50 p-2 -mx-2 rounded-lg"
                    : "text-gray-600"
                }`}
              >
                <span>{day.day}</span>
                <span className={isToday ? "text-primary-700" : ""}>
                  {day.active && day.intervals.length > 0
                    ? `${day.intervals[0].start} - ${day.intervals[day.intervals.length - 1].end}`
                    : "Fechado"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Payments Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Pagamento</h3>
        <div className="flex flex-col gap-3">
          {business.payment_methods && business.payment_methods.length > 0 ? (
            business.payment_methods.map((method) => (
              <div key={method} className="flex items-center gap-3 text-sm text-gray-600">
                <CreditCard className="h-4 w-4 text-gray-400" />
                {method}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">Não informado</p>
          )}
        </div>
      </div>

      {/* Social Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Redes Sociais</h3>
        <div className="flex gap-4">
          {business.social_media?.instagram && (
            <a
              href={business.social_media.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-pink-600 transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
          )}
          {business.social_media?.facebook && (
            <a
              href={business.social_media.facebook}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Facebook className="h-6 w-6" />
            </a>
          )}
          {business.social_media?.whatsapp && (
            <a
              href={business.social_media.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-green-500 transition-colors"
            >
              <MessageCircle className="h-6 w-6" />
            </a>
          )}
          {business.social_media?.website && (
            <a
              href={business.social_media.website}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-gray-800 transition-colors"
            >
              <Globe className="h-6 w-6" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};