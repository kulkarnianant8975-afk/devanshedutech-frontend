import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Lightbulb, Users, CheckCircle2, Linkedin, X } from 'lucide-react';
import { mentorService } from '../services/mentorService';
import { MentorResponseDTO as Mentor } from '../dtos';
import { AnimatePresence } from 'framer-motion';

const About = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const data = await mentorService.getAll();
        setMentors(data);
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            About <span className="text-primary">Us</span>
          </motion.h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Learn more about our mission, vision, and the team behind Devansh Edu-Tech Classes.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Our Institute"
                className="rounded-[40px] shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">Empowering the Next Generation of Tech Leaders</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Devansh Edu-Tech Classes is a professional training institute dedicated to delivering high-quality technical education and skill development. Our goal is to prepare students for real-world industry challenges through practical learning and expert mentorship.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Founded with a vision to bridge the gap between traditional education and industry requirements, we have helped hundreds of students transition into successful tech careers.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <p className="text-3xl font-bold text-primary mb-1">5+</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Years Experience</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <p className="text-3xl font-bold text-primary mb-1">1000+</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Students Trained</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white/5 p-10 rounded-[40px] border border-white/10"
            >
              <div className="p-4 bg-primary rounded-2xl w-fit mb-6">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed">
                To provide accessible, high-quality technical training that empowers individuals to achieve their professional goals and contribute to the global tech ecosystem.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white/5 p-10 rounded-[40px] border border-white/10"
            >
              <div className="p-4 bg-primary rounded-2xl w-fit mb-6">
                <Eye size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-400 leading-relaxed">
                To be the leading ed-tech institute recognized for excellence in technical education, innovation in teaching methodologies, and outstanding student outcomes.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white/5 p-10 rounded-[40px] border border-white/10"
            >
              <div className="p-4 bg-primary rounded-2xl w-fit mb-6">
                <Lightbulb size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Values</h3>
              <p className="text-gray-400 leading-relaxed">
                Integrity, Innovation, Student-Centricity, and Excellence. We believe in continuous learning and fostering a supportive environment for growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Teaching Approach */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">How We Teach</h2>
            <h3 className="text-4xl font-bold">Our Teaching Approach</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Practical Learning', desc: '80% practical and 20% theory to ensure deep understanding.' },
              { title: 'Industry Projects', desc: 'Work on real-world projects to build a strong portfolio.' },
              { title: 'Personal Mentorship', desc: 'One-on-one guidance from experienced industry experts.' },
              { title: 'Continuous Assessment', desc: 'Regular tests and feedback to track your progress.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold mb-3">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Our Experts</h2>
            <h3 className="text-4xl font-bold">Meet Our Mentors</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-[40px] h-80 animate-pulse border border-gray-100" />
              ))
            ) : mentors.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-[40px] border border-gray-100 text-gray-500">
                Our expert mentors will be listed here soon.
              </div>
            ) : (
              mentors.map((mentor) => (
                <motion.div
                  key={mentor.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  <div 
                    className="h-64 overflow-hidden cursor-zoom-in"
                    onClick={() => setSelectedImage(mentor.imageUrl || `https://picsum.photos/seed/${mentor.id}/800/1000`)}
                  >
                    <img
                      src={mentor.imageUrl || `https://picsum.photos/seed/${mentor.id}/400/500`}
                      alt={mentor.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="p-8 text-center flex-grow flex flex-col justify-center">
                    <h4 className="font-bold text-secondary text-xl mb-1">{mentor.name}</h4>
                    <p className="text-primary font-bold text-sm mb-4 uppercase tracking-wider">{mentor.role}</p>
                    
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6">
                      {mentor.description}
                    </p>

                    <div className="mt-auto flex items-center justify-center space-x-6">
                      {mentor.linkedinUrl && (
                        <a 
                          href={mentor.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary transition-colors"
                        >
                          <Linkedin size={20} />
                        </a>
                      )}
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className="text-primary text-xs">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
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
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center pointer-events-none"
            >
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl pointer-events-auto"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors pointer-events-auto"
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

export default About;
