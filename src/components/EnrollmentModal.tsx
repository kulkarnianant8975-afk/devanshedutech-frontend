import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, GraduationCap, Phone, Mail, MapPin, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName?: string;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, courseName }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    education: '',
    city: '',
    course: courseName || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (courseName) {
      setFormData(prev => ({ ...prev, course: courseName }));
    }
  }, [courseName]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Enter a valid mobile number (10-15 digits)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.education.trim()) newErrors.education = 'Education is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.course.trim()) newErrors.course = 'Course selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/leads', {
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobile,
        education: formData.education,
        cityName: formData.city,
        courseInterested: formData.course,
        type: 'enrollment',
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          fullName: '',
          email: '',
          mobile: '',
          education: '',
          city: '',
          course: courseName || ''
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-secondary/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-8 text-white relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Enroll Now</h2>
                  <p className="text-orange-100">Take the first step towards your career</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8 overflow-y-auto">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Enrollment Request Sent!</h3>
                  <p className="text-gray-500">Our counselor will contact you shortly to guide you through the process.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`w-full px-4 py-3 bg-gray-50 border ${errors.fullName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className={`w-full px-4 py-3 bg-gray-50 border ${errors.mobile ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="9876543210"
                      />
                      {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Education *</label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-50 border ${errors.education ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      placeholder="e.g. B.Tech, BCA, Graduate"
                    />
                    {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-50 border ${errors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      placeholder="Your City"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Course *</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className={`w-full px-4 py-3 bg-gray-50 border ${errors.course ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      placeholder="Course you want to enroll in"
                    />
                    {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 hover:-translate-y-1 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Submit Enrollment</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                    By submitting, you agree to our terms and conditions.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnrollmentModal;
