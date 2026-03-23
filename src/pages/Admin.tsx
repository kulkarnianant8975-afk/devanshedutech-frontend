import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Briefcase, 
  LogOut, 
  Menu, 
  X,
  Lock,
  ChevronRight,
  HelpCircle,
  Award
} from 'lucide-react';
import { authService } from '../services/api';
import { UserResponseDTO as User } from '../dtos';

// Admin Components
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminCourses from '../components/admin/AdminCourses';
import AdminLeads from '../components/admin/AdminLeads';
import AdminHiring from '../components/admin/AdminHiring';
import AdminMentors from '../components/admin/AdminMentors';
import AdminPlacedStudents from '../components/admin/AdminPlacedStudents';

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'leads' | 'hiring' | 'mentors' | 'placed_students'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [authError, setAuthError] = useState<React.ReactNode>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getMe();
        if (currentUser && currentUser.role === 'admin') {
          setUser(currentUser);
          setIsAdmin(true);
          setAuthError('');
        } else {
          setUser(currentUser);
          setIsAdmin(false);
        }
      } catch (error: any) {
        setUser(null);
        setIsAdmin(false);
        if (error.response?.status !== 401) {
          setAuthError(`Authentication error: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLocalAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      console.log(`Attempting ${isRegisterMode ? 'registration' : 'login'} for ${email}`);
      if (isRegisterMode) {
        const res = await authService.register({ email, password, displayName });
        console.log('Registration response:', res);
      } else {
        const res = await authService.login({ email, password });
        console.log('Login response:', res);
      }
      
      console.log('Fetching current user after auth...');
      const currentUser = await authService.getMe();
      console.log('Current user after auth:', currentUser);
      
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser);
        setIsAdmin(true);
      } else {
        setUser(currentUser);
        setIsAdmin(false);
      }
    } catch (error: any) {
      console.error('Local auth error:', error);
      setAuthError(error.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-xl border border-gray-100"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">Admin Portal</h1>
          
          {user && !isAdmin && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 text-center border border-red-100">
              Logged in as <strong>{user.email}</strong>, but you do not have administrator permissions.
            </div>
          )}

          <p className="text-gray-500 mb-8 text-center">
            {isRegisterMode ? 'Create an account to access the dashboard.' : 'Access the dashboard with your credentials.'}
          </p>

          {authError && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-6 text-center border border-red-100">
              {authError}
            </div>
          )}

          <form onSubmit={handleLocalAuth} className="space-y-4 mb-8">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoggingIn ? 'Processing...' : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">OR</span>
            </div>
          </div>

          <button
            onClick={() => authService.loginWithGoogle()}
            className="w-full bg-white border border-gray-100 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center space-y-4">
            <button 
              onClick={async () => {
                try {
                  const res = await authService.getMe();
                  alert(`Auth Status: Logged in as ${res.email} (${res.role})`);
                } catch (e) {
                  alert(`Auth Status: Not logged in (401)`);
                }
              }}
              className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
            >
              Check Auth Status
            </button>
            <a 
              href="/api/debug/auth" 
              target="_blank"
              className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
            >
              View Debug Auth Info
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Student Leads', icon: Users },
    { id: 'courses', label: 'Manage Courses', icon: BookOpen },
    { id: 'hiring', label: 'Hiring Posts', icon: Briefcase },
    { id: 'mentors', label: 'Mentors', icon: Users },
    { id: 'placed_students', label: 'Success Stories', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 lg:relative z-[60] transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isSidebarOpen ? 'lg:w-72' : 'lg:w-20'
        } bg-white border-r border-gray-100 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center p-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-orange-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={22} />
              {(isSidebarOpen || window.innerWidth < 1024) && (
                <span className="ml-4 font-bold">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <a
            href="mailto:Kulkarnianant8975@gmail.com"
            className="w-full flex items-center p-4 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <HelpCircle size={22} />
            {(isSidebarOpen || window.innerWidth < 1024) && <span className="ml-4 font-bold">Support</span>}
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut size={22} />
            {(isSidebarOpen || window.innerWidth < 1024) && <span className="ml-4 font-bold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto h-screen p-4 md:p-8">
        <header className="flex items-center justify-between mb-8 md:mb-10">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-600"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-gray-500 text-sm md:text-base">Welcome back, {user.displayName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-sm">{user.displayName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="relative group flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm"
            >
              <img 
                src={user.photoURL || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white font-bold leading-tight">View</span>
              </div>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'leads' && <AdminLeads />}
            {activeTab === 'courses' && <AdminCourses />}
            {activeTab === 'hiring' && <AdminHiring />}
            {activeTab === 'mentors' && <AdminMentors />}
            {activeTab === 'placed_students' && <AdminPlacedStudents />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Profile Picture Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsProfileModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
              
              <h3 className="text-xl font-bold mb-6">Profile Picture</h3>
              
              <div className="w-48 h-48 mx-auto mb-6 rounded-3xl overflow-hidden shadow-inner border-4 border-gray-50 flex items-center justify-center bg-gray-100">
                <img 
                  src={user.photoURL || 'https://via.placeholder.com/150'} 
                  alt="Profile View" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <label className="cursor-pointer inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100">
                <span>Change Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = async () => {
                          const canvas = document.createElement('canvas');
                          const MAX_SIZE = 200;
                          let width = img.width;
                          let height = img.height;
                          if (width > height) {
                            if (width > MAX_SIZE) {
                              height *= MAX_SIZE / width;
                              width = MAX_SIZE;
                            }
                          } else {
                            if (height > MAX_SIZE) {
                              width *= MAX_SIZE / height;
                              height = MAX_SIZE;
                            }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx?.drawImage(img, 0, 0, width, height);
                          const base64 = canvas.toDataURL('image/jpeg', 0.8);
                          
                          try {
                            await authService.updateProfilePicture(base64);
                            setUser({...user, photoURL: base64});
                            setIsProfileModalOpen(false);
                          } catch (err: any) {
                            console.error("Failed to update profile picture", err.response?.data || err);
                            alert("Failed to upload image. " + (err.response?.status === 500 ? "Image is too large." : ""));
                          }
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
