import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Users, Award, BookOpen, MessageCircle, Quote, X } from 'lucide-react';
import { placedStudentService } from '../services/placedStudentService';
import { PlacedStudentResponseDTO as PlacedStudent } from '../dtos';
import { Link } from 'react-router-dom';
import { courses as staticCourses } from '../data/courses';
import CourseCard from '../components/CourseCard';
import api, { backendUrl } from '../services/api';
import { AnimatePresence } from 'framer-motion';

// Lazy-load below-fold sections so they don't block initial render
const InstagramFeed = lazy(() => import('../components/InstagramFeed'));
const HiringSection = lazy(() => import('../components/HiringSection'));

const Home = () => {
  const [popularCourses, setPopularCourses] = useState<any[]>(staticCourses.slice(0, 4));
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [successStories, setSuccessStories] = useState<PlacedStudent[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  const toggleStory = (id: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStories(newExpanded);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    // Resolve relative backend paths to absolute production URL if necessary
    if (url.startsWith('/api')) {
      return backendUrl ? `${backendUrl}${url}` : url;
    }
    // Handle paths starting with / (relative to public folder)
    if (url.startsWith('/') && !url.startsWith('/api')) return url;
    return url;
  };

  useEffect(() => {
    const loadPageData = async () => {
      // Fire both requests simultaneously — saves one full round-trip latency
      const [coursesResult, storiesResult] = await Promise.allSettled([
        api.get('/courses?limit=4'),
        placedStudentService.getAll()
      ]);

      if (coursesResult.status === 'fulfilled') {
        const data = coursesResult.value.data;
        if (data && data.length > 0) {
          setPopularCourses(data.map((course: any) => ({
            ...course,
            fee: course.price || course.fee,
            icon: BookOpen
          })));
        }
      }
      setLoadingCourses(false);

      if (storiesResult.status === 'fulfilled') {
        setSuccessStories(storiesResult.value);
      }
      setLoadingStories(false);
    };

    loadPageData();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
        {/* Static Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1400" 
            alt="Campus" 
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/5 backdrop-blur-[2px] p-6 md:p-10 rounded-[40px] border border-white/10"
            >
              <span className="inline-block px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest mb-6">
                Welcome to the Future of Learning
              </span>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">
                Devansh <span className="text-primary">Edu-Tech</span> Classes
              </h1>
              <p className="text-lg text-white/90 mb-10 max-w-lg leading-relaxed">
                Building Future Tech Professionals through expert-led training, practical projects, and industry-aligned curriculum.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/courses"
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl shadow-orange-200"
                >
                  Explore Courses
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  to="/contact"
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  Contact Us
                </Link>
              </div>

              <div className="mt-12 flex items-center space-x-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/images/avatars/student_avatar_${i}.png`}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover"
                    />
                  ))}
                </div>
                <div className="text-white">
                  <div className="flex items-center space-x-1 mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-primary text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-sm font-bold">1000+ Students Enrolled</p>
                  <p className="text-xs text-white/70">Join our growing community</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Our Programs</h2>
            <h3 className="text-4xl font-bold mb-6">Popular Courses</h3>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Choose from our most sought-after technical programs designed to get you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center text-primary font-bold hover:underline"
            >
              View All Courses
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Award, title: 'Certified Courses', desc: 'Get industry-recognized certificates.' },
                  { icon: Users, title: 'Expert Faculty', desc: 'Learn from working professionals.' },
                  { icon: BookOpen, title: 'Hands-on Projects', desc: 'Build real-world applications.' },
                  { icon: MessageCircle, title: 'Placement Support', desc: 'Resume building & mock interviews.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-50 text-primary rounded-xl w-fit mb-4">
                      <item.icon size={24} />
                    </div>
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Why Us?</h2>
              <h3 className="text-4xl font-bold mb-6">Experience the Best Technical Education</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We don't just teach code; we build careers. Our methodology focuses on practical implementation, ensuring every student is ready for the industry from day one.
              </p>
              <ul className="space-y-4 mb-10">
                {['Live Interactive Sessions', 'Doubt Clearing Support', 'Lifetime Access to Materials', 'Industry Tie-ups for Placements'].map((text, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <CheckCircle size={14} />
                    </div>
                    <span className="text-gray-700 font-medium">{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/about"
                className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold inline-block hover:bg-black transition-all"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Success Stories</h2>
            <h3 className="text-4xl font-bold mb-6">What Our Students Say</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingStories ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 h-64 rounded-3xl animate-pulse" />
              ))
            ) : successStories.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-3xl">
                Success stories from our alumni will be featured here soon.
              </div>
            ) : (
              successStories.map((story) => (
                <motion.div 
                  key={story.id} 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group"
                >
                  <div 
                    className="h-64 overflow-hidden relative cursor-zoom-in"
                    onClick={() => setSelectedImage(getImageUrl(story.imageUrl) || `https://i.pravatar.cc/1000?u=${story.id}`)}
                  >
                    <img 
                      src={getImageUrl(story.imageUrl) || `https://i.pravatar.cc/150?u=${story.id}`} 
                      alt={story.name} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
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
                      <p className={`text-gray-500 italic text-sm leading-relaxed mb-6 ${!expandedStories.has(story.id) ? 'line-clamp-4' : ''}`}>
                        "{story.testimonial}"
                      </p>
                      {story.testimonial && story.testimonial.length > 150 && (
                        <button
                          onClick={() => toggleStory(story.id)}
                          className="text-primary text-xs font-bold hover:underline focus:outline-none mb-6 -mt-4 block"
                        >
                          {expandedStories.has(story.id) ? 'Show Less' : 'See More'}
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* Hiring Section - lazy loaded */}
      <Suspense fallback={<div className="h-48 bg-gray-50 animate-pulse rounded-3xl mx-8" />}>
        <HiringSection />
      </Suspense>

      {/* Instagram Feed - lazy loaded */}
      <Suspense fallback={<div className="h-80 bg-white animate-pulse" />}>
        <InstagramFeed />
      </Suspense>

      {/* Newsletter */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-bg rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/5 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Tech Journey?</h3>
              <p className="text-white/80 mb-10">Subscribe to our newsletter for the latest course updates and tech news.</p>
              <form className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/20 border border-white/30 rounded-2xl px-6 py-4 placeholder:text-white/60 focus:outline-none focus:bg-white/30 transition-all"
                />
                <button className="bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                  Subscribe Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center pointer-events-none text-white"
            >
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl pointer-events-auto"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 hover:text-primary transition-colors pointer-events-auto"
              >
                <X size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
