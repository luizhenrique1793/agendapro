import React from "react";
import { Star } from "lucide-react";

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
}

const mockReviews: Review[] = [
  {
    id: 1,
    name: "Carlos Silva",
    rating: 5,
    text: "Atendimento impecável e corte perfeito! Recomendo a todos.",
  },
  {
    id: 2,
    name: "João Pereira",
    rating: 5,
    text: "Ambiente super agradável e profissionais excelentes.",
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">O que nossos clientes dizem</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                <div className="flex text-yellow-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-sm italic">"{review.text}"</p>
          </div>
        ))}
      </div>
    </section>
  );
};