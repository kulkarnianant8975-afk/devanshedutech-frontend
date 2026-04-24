import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, ArrowRight } from 'lucide-react';
import { Course } from '../data/courses';
import BrochureModal from './BrochureModal';
import { resolveImageUrl } from '../utils/imageUtils';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const Icon = course.icon;


  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <>
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {course.image ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
              </div>
            )}
            <img 
              src={resolveImageUrl(course.image)} 
              alt={course.name} 
              onLoad={() => setIsImageLoading(false)}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                isImageLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <Icon size={48} className="text-primary/20" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full shadow-sm">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-orange-50 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <Icon size={24} />
          </div>
        </div>

          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {course.name}
          </h3>
          
          <p className="text-gray-500 text-sm mb-6 line-clamp-2">
            {course.description}
          </p>

          <div className="flex items-center mb-6 pt-4 border-t border-gray-50">
            <div className="flex items-center text-gray-400 text-xs">
              <Clock size={14} className="mr-1" />
              {course.duration}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsBrochureModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300"
            >
              <Download size={16} />
              <span className="text-xs">Brochure</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-enrollment'))}
              className="flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all duration-300"
            >
              <span className="text-xs">Enroll Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="h-1 w-0 bg-primary group-hover:w-full transition-all duration-500" />
      </motion.div>

      <BrochureModal 
        isOpen={isBrochureModalOpen} 
        onClose={() => setIsBrochureModalOpen(false)} 
        courseTitle={course.name}
        courseId={course.id}
      />
    </>
  );
};

export default CourseCard;
