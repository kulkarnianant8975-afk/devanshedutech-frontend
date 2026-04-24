import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api, { backendUrl } from '../services/api';

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
  courseId?: string;
}

const BrochureModal: React.FC<BrochureModalProps> = ({ isOpen, onClose, courseTitle, courseId }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    education: '',
    cityName: '',
    mobileNumber: '',
    email: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateMobile = (mobile: string) => {
    return /^[0-9]{10,15}$/.test(mobile);
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Optional
    return /^[^@]+@[^@]+\.[^@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMobile(formData.mobileNumber)) {
      setStatus('error');
      setErrorMessage('Please enter a valid mobile number (10-15 digits).');
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    try {
      await api.post('/leads', {
        ...formData,
        courseInterested: courseTitle || 'General',
      });
      setStatus('success');
      
      try {
        const { settingsService } = await import('../services/api');
        let result = null;
        
        // 1. Try course-specific brochure first
        if (courseId) {
          try {
            const courseResult = await settingsService.getCourseBrochure(courseId);
            if (courseResult && courseResult.downloadUrl) {
              result = courseResult;
            }
          } catch (err) {
            console.log('Course-specific brochure not found, checking global...');
          }
        }
        
        // 2. Fall back to global brochure if course-specific not found
        if (!result || !result.downloadUrl) {
          try {
            const globalResult = await settingsService.getBrochure();
            if (globalResult && globalResult.downloadUrl) {
              result = globalResult;
            }
          } catch (err) {
            console.log('Global brochure not found');
          }
        }

        if (result && result.downloadUrl) {
          // Ensure the download URL is absolute if needed
          const fullUrl = result.downloadUrl.startsWith('/') 
            ? `${backendUrl}${result.downloadUrl}` 
            : result.downloadUrl;
          
          console.log('Starting brochure download from:', fullUrl);
          
          // Use a hidden anchor tag with download attribute for best results
          const link = document.createElement('a');
          link.href = fullUrl;
          link.setAttribute('download', courseTitle ? `${courseTitle.replace(/\s+/g, '_')}_Brochure.pdf` : 'Devansh_Course_Brochure.pdf');
          link.setAttribute('target', '_blank'); // Helps with cross-origin or if browser blocks same-tab download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // No brochure available — inform user
          console.log('No brochure found for download');
          alert('Thank you for your interest! Our team will share the brochure with you on your registered contact details shortly.');
        }
      } catch (err) {
        console.error('Error fetching brochure info:', err);
        alert('Thank you for your interest! Our team will share the brochure with you shortly.');
      }
      
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData({ fullName: '', education: '', cityName: '', mobileNumber: '', email: '' });
      }, 4000);
    } catch (error) {
      console.error('Error submitting lead:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again later.');
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 md:p-12 overflow-y-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Download Brochure</h3>
                <p className="text-gray-500">
                  {courseTitle ? `Get the full syllabus for ${courseTitle}` : 'Please enter your details to receive the brochure.'}
                </p>
              </div>

              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Thank You!</h4>
                  <p className="text-gray-600">Your details have been received. If a brochure is available, your download will begin automatically.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Education *</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="B.E. / B.Tech"
                        value={formData.education}
                        onChange={e => setFormData({...formData, education: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Pune"
                        value={formData.cityName}
                        onChange={e => setFormData({...formData, cityName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      required
                      type="tel"
                      className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                      <AlertCircle size={18} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    disabled={status === 'submitting'}
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-600 transition-all disabled:opacity-50 mt-6"
                  >
                    {status === 'submitting' ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit & Download</span>
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BrochureModal;
