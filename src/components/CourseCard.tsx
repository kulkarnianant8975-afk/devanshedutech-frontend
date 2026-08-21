import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Download, ArrowRight } from 'lucide-react';
import { Course } from '../data/courses';
import BrochureModal from './BrochureModal';
import { resolveImageUrl } from '../utils/imageUtils';

interface CourseCardProps {
  course: Course;
  /**
   * Position in the grid. Only used to decide whether this card's image is something the visitor
   * is already looking at, or something they may never scroll to.
   */
  index?: number;
}

/** Roughly the first row on a wide screen — the images a visitor is actually waiting for. */
const ABOVE_THE_FOLD = 4;

const CourseCard: React.FC<CourseCardProps> = ({ course, index = 0 }) => {
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const Icon = course.icon;

  const [isImageLoading, setIsImageLoading] = useState(true);
  // A URL that will not load is not the same as no URL at all, and the difference used to be
  // invisible: onLoad never fired, so the image stayed at opacity-0 and the card sat under a
  // spinner forever. Falling back to the same placeholder an image-less course gets is honest,
  // and it ends.
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = Boolean(course.image) && !imageBroken;
  const eager = index < ABOVE_THE_FOLD;

  return (
    <>
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {showImage ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
              </div>
            )}
            <img 
              // 600px covers the card at 2x on a phone; the slot itself is nowhere near that.
              src={resolveImageUrl(course.image, 600)} 
              alt={course.name} 
              onLoad={() => setIsImageLoading(false)}
              onError={() => { setImageBroken(true); setIsImageLoading(false); }}
              // The first row is the page. Deferring those is asking the browser to wait before
              // fetching the one thing the visitor came to look at; everything below can wait.
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager ? 'high' : 'auto'}
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

          {/* The whole title is the link, so an advertisement and a browsing visitor both end
              up on the same page. Falls back to the id for a course with no slug yet. */}
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            <Link to={`/courses/${course.slug ?? course.id}`} className="hover:underline">
              {course.name}
            </Link>
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
              onClick={() => window.dispatchEvent(new CustomEvent('open-enrollment', { detail: { courseName: course.name } }))}
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
