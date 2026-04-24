import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUtils';
import { PlacedStudentResponseDTO as PlacedStudent } from '../dtos';

interface SuccessStoryCardProps {
  story: PlacedStudent;
  onImageClick: (url: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ 
  story, 
  onImageClick, 
  isExpanded, 
  onToggle 
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const imageUrl = resolveImageUrl(story.imageUrl) || `https://i.pravatar.cc/150?u=${story.id}`;
  const largeImageUrl = resolveImageUrl(story.imageUrl) || `https://i.pravatar.cc/1000?u=${story.id}`;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group"
    >
      <div 
        className="aspect-[4/5] w-full overflow-hidden relative cursor-zoom-in bg-gray-100"
        onClick={() => onImageClick(largeImageUrl)}
      >
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
          </div>
        )}
        <img 
          src={imageUrl} 
          alt={story.name} 
          onLoad={() => setIsImageLoading(false)}
          className={`w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ${
            isImageLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <Quote className="text-white/80 drop-shadow-md" size={32} />
        </div>
      </div>

      <div className="p-8 text-center flex-grow flex flex-col">
        <h4 className="font-extrabold text-secondary text-xl mb-1">{story.name}</h4>
        <span className="text-primary font-bold text-sm uppercase tracking-widest mb-4 inline-block">{story.company}</span>
        
        <div className="relative">
          <p className={`text-gray-500 italic text-sm leading-relaxed mb-6 ${!isExpanded ? 'line-clamp-4' : ''}`}>
            "{story.testimonial}"
          </p>
          {story.testimonial && story.testimonial.length > 150 && (
            <button
              onClick={onToggle}
              className="text-primary text-xs font-bold hover:underline focus:outline-none mb-6 -mt-4 block mx-auto"
            >
              {isExpanded ? 'Show Less' : 'See More'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-50 space-y-2">
           <div className="flex justify-between items-center text-xs">
             <span className="text-gray-400 font-bold uppercase tracking-tighter">Placement Role</span>
             <span className="font-bold text-secondary">{story.role}</span>
           </div>
           <div className="flex justify-between items-center text-xs">
             <span className="text-gray-400 font-bold uppercase tracking-tighter">Package</span>
             <span className="font-black text-emerald-600">{story.salaryPackage}</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuccessStoryCard;
