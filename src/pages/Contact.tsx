import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Clock, Globe, Instagram, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post('/api/messages', {
        ...formData,
      });
      setIsSuccess(true);
      setFormData({ fullName: '', email: '', mobile: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Contact <span className="text-primary">Us</span>
          </motion.h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to us via any of the channels below.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-8">Get in Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-50 text-primary rounded-xl">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">Our Location</p>
                      <a 
                        href="https://maps.google.com/?q=Mantri+Complex+Parbhani+Devansh+Edu-Tech+Classes" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 leading-relaxed hover:text-primary transition-colors"
                      >
                        Mantri Complex, 2nd floor, besides Chintamani Maharaj Mandir, above Wellness Forever Medical, Vasmat Road, Parbhani
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-50 text-primary rounded-xl">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">Phone Number</p>
                      <a href="tel:+918669880738" className="text-sm text-gray-500 hover:text-primary transition-colors">+91 8669880738</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-50 text-primary rounded-xl">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">Email Address</p>
                      <a href="mailto:dceca.pbn@gmail.com" className="text-sm text-gray-500 hover:text-primary transition-colors">dceca.pbn@gmail.com</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-50 text-primary rounded-xl">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">Working Hours</p>
                      <p className="text-sm text-gray-500">Mon - Sat: 9:00 AM - 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-secondary text-white rounded-[40px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                <h4 className="text-xl font-bold mb-4 relative z-10">Follow Us</h4>
                <div className="flex space-x-4 relative z-10">
                  <a href="https://www.instagram.com/madhav_sharma0508/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                    <Globe size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-50">
                <h3 className="text-2xl font-bold mb-8">Send us a Message</h3>
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-gray-500">Thank you for reaching out. We will get back to you soon.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input
                          required
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="John Doe"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                      <input
                        required
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        pattern="[0-9]{10,15}"
                        placeholder="10-15 digit phone number"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Purpose / Message</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={20} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[40px] overflow-hidden shadow-2xl h-[500px] border-8 border-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3761.564756858641!2d76.76443687521516!3d19.25774598198428!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd829f0458629f1%3A0x6444444444444444!2sMantri%20Complex%2C%20Parbhani!5e0!3m2!1sen!2sin!4v1710123456789!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Institute Location"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
