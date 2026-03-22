import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Logo variant="light" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering students with industry-relevant technical skills. We bridge the gap between education and professional excellence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="https://www.instagram.com/madhav_sharma0508/" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-primary transition-colors text-sm">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-primary transition-colors text-sm">All Courses</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-primary transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>

          {/* Popular Courses */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Popular Courses</h3>
            <ul className="space-y-4">
              <li><Link to="/courses" className="text-gray-400 hover:text-primary transition-colors text-sm">Full Stack Web Development</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-primary transition-colors text-sm">Python Development</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-primary transition-colors text-sm">Java Development</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-primary transition-colors text-sm">Software Testing</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-primary shrink-0 mt-1" />
                <a 
                  href="https://maps.google.com/?q=Mantri+Complex+Parbhani+Devansh+Edu-Tech+Classes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors text-sm"
                >
                  Mantri Complex, 2nd floor, Vasmat Road, Parbhani
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-primary shrink-0" />
                <a href="tel:+918669880738" className="text-gray-400 hover:text-primary transition-colors text-sm">+91 8669880738</a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-primary shrink-0" />
                <a href="mailto:dceca.pbn@gmail.com" className="text-gray-400 hover:text-primary transition-colors text-sm">dceca.pbn@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-500 text-xs text-center">
            © 2026 Devansh Edu-Tech Classes. All Rights Reserved.
          </p>
          <div className="flex space-x-6 text-xs text-gray-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <Link to="/admin" className="hover:text-primary transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
