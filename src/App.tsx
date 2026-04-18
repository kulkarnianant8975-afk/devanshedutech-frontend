import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

// Components (always needed, load eagerly)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Logo from './components/Logo';
import EnrollmentModal from './components/EnrollmentModal';

// Heavy components: lazy-loaded so they don't block initial paint
const WhatsAppButton = lazy(() => import('./components/WhatsAppButton'));
const AIChatbot      = lazy(() => import('./components/AIChatbot'));

// Pages: ALL lazy-loaded (biggest win — none of these are needed until navigation)
const Home       = lazy(() => import('./pages/Home'));
const About      = lazy(() => import('./pages/About'));
const AllCourses = lazy(() => import('./pages/AllCourses'));
const Contact    = lazy(() => import('./pages/Contact'));
const Admin      = lazy(() => import('./pages/Admin')); // 19KB — never needed by public users

import { useAnalytics } from './lib/useAnalytics';
import { usePersistedState } from './lib/usePersistedState';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Edge Case: Use Persisted State to prevent user progress loss on refresh/crash
  const [isEnrollModalOpen, setIsEnrollModalOpen] = usePersistedState('isEnrollModalOpen', false);
  const [selectedCourse, setSelectedCourse] = usePersistedState<string | undefined>('selectedCourse', undefined);
  
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for global enroll event
    const handleEnrollEvent = (e: any) => {
      const course = e.detail?.courseName;
      setSelectedCourse(course);
      setIsEnrollModalOpen(true);
      // Track Analytics
      trackEvent('enrollment_modal_opened', { course });
    };
    window.addEventListener('open-enrollment', handleEnrollEvent);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-enrollment', handleEnrollEvent);
    };
  }, []);

  return (
    <div className={`flex flex-col ${!isAdmin ? 'min-h-screen' : ''}`}>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className={!isAdmin ? "flex-grow" : ""}>
        <AnimatePresence mode="wait">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <Logo />
              </motion.div>
            </div>
          }>
            <Routes>
              <Route path="/"        element={<Home />} />
              <Route path="/about"   element={<About />} />
              <Route path="/courses" element={<AllCourses />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin"   element={<Admin />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}

      {!isAdmin && (
        <>
          <EnrollmentModal 
            isOpen={isEnrollModalOpen} 
            onClose={() => setIsEnrollModalOpen(false)} 
            courseName={selectedCourse}
          />
          <Suspense fallback={null}>
            <WhatsAppButton />
            <AIChatbot />
          </Suspense>
          <AnimatePresence>
            {showBackToTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-orange-600 transition-colors"
              >
                <ArrowUp size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
