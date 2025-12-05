import React from "react";
import { Share2, Star, MapPin } from "lucide-react";
import { Business } from "../../../types";

interface BusinessHeroProps {
  business: Business;
}

export const BusinessHero: React.FC<BusinessHeroProps> = ({ business }) => {
  const ad = business.address_details;
  const fullAddress = ad
    ? `${ad.street}, ${ad.number} - ${ad.neighborhood}, ${ad.city} - ${ad.state}`
    : business.address || "Endereço não informado";
  
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <>
      {/* Hero Images Grid */}
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[480px] bg-gray-200">
        {business.photos && business.photos.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 h-full gap-1 p-1">
            {/* Main Image */}
            <div className="col-span-4 md:col-span-2 row-span-2 relative overflow-hidden group">
              <img
                src={business.photos[0]}
                alt="Principal"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {/* Side Images */}
            {business.photos.slice(1, 5).map((photo, i) => (
              <div
                key={i}
                className={`hidden md:block col-span-1 row-span-1 relative overflow-hidden group ${
                  i === 2 && business.photos!.length === 4 ? "row-span-2" : ""
                }`}
              >
                <img
                  src={photo}
                  alt={`Galeria ${i}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
            {/* Fallback pattern if only 1 photo */}
            {business.photos.length === 1 && (
              <div className="hidden md:flex col-span-2 row-span-2 items-center justify-center bg-gray-100 text-gray-400">
                <span className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Mais fotos em breve
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-slate-200 flex items-center justify-center text-gray-400">
            <span className="flex items-center gap-2">
              <Share2 className="h-8 w-8" /> Sem fotos disponíveis
            </span>
          </div>
        )}
      </div>

      {/* Floating Business Card */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 sm:-mt-20 mb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
             <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {business.type || "Barbearia"}
                </span>
                <div className="flex items-center text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-700">5.0 (Novo)</span>
                </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {business.name}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">
              {business.description || "Corte de cabelo e barba com estilo e tradição."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 md:flex-none items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex gap-2"
            >
              <Share2 className="h-5 w-5" /> Compartilhar
            </button>
            <a
              href="#services"
              className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-center"
            >
              Agendar agora
            </a>
          </div>
        </div>
      </div>
    </>
  );
};