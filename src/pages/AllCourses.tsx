import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, BookOpen } from 'lucide-react';
import { courses as staticCourses } from '../data/courses';
import CourseCard from '../components/CourseCard';
import api from '../services/api';

import { useQuery } from '@tanstack/react-query';

const AllCourses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch courses with React Query
  const { data: courses = staticCourses, isLoading: loading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      if (response.data && response.data.length > 0) {
        return response.data.map((course: any) => ({ 
          ...course,
          fee: course.price || course.fee,
          icon: BookOpen
        }));
      }
      return staticCourses;
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });

  const categories = ['All', ...new Set(courses.map(c => c.category))];

  const filteredCourses = courses.filter(course => {
    const name = course.name || course.title || '';
    const description = course.description || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <section className="bg-secondary text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 text-center"
          >
            All <span className="text-primary">Courses</span>
          </motion.h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-center">
            Explore our comprehensive range of technical programs designed to help you master the most in-demand skills in the industry.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="flex items-center text-gray-500 mr-2 shrink-0">
                <Filter size={18} className="mr-2" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-lg shadow-orange-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="popLayout">
            {filteredCourses.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 text-gray-400 rounded-full mb-6">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">No courses found</h3>
                <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="mt-6 text-primary font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Questions?</h2>
            <h3 className="text-4xl font-bold">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-6">
            {[
              { q: 'Do you provide certificates?', a: 'Yes, we provide industry-recognized certificates upon successful completion of each course.' },
              { q: 'What is the mode of training?', a: 'We offer both offline (classroom) and online interactive sessions depending on the course and batch.' },
              { q: 'Do you offer placement assistance?', a: 'Absolutely! We have a dedicated placement cell that helps with resume building, mock interviews, and job referrals.' },
              { q: 'Can I pay the fee in installments?', a: 'Yes, we have flexible installment options available for most of our long-term professional courses.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-50 rounded-2xl p-6 cursor-pointer">
                <summary className="flex justify-between items-center font-bold text-lg list-none">
                  {faq.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AllCourses;
