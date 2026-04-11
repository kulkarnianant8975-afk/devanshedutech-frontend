import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Linkedin,
  X,
  Save,
  X,
  Save,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { mentorService } from '../../services/mentorService';
import { authService } from '../../services/api';
import { MentorResponseDTO as Mentor } from '../../dtos';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, resolveImageUrl, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '../../utils/imageUtils';

const AdminMentors = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    imageUrl: '',
    linkedinUrl: ''
  });

  const DRAFT_KEY = 'mentor_form_draft';

  const saveToDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    setSuccess("Draft saved successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const loadDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setFormData(JSON.parse(draft));
      setShowDraftPrompt(false);
      setSuccess("Draft restored!");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const data = await mentorService.getAll();
      setMentors(data);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const user = await authService.getMe();
        console.log("Current user auth state:", user);
        setUserRole(user.role);
        if (user.role?.toUpperCase() !== 'ADMIN') {
          console.warn("User does not have ADMIN role. Current role:", user.role);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
      fetchMentors();
    };
    checkAuthAndFetch();

    // Check for draft
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.name || parsed.role || parsed.description) {
        setShowDraftPrompt(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Attempting to save mentor with role:", userRole);
      if (editingMentor) {
        await mentorService.update(editingMentor.id, formData);
        setSuccess("Mentor updated successfully!");
      } else {
        await mentorService.create(formData);
        setSuccess("Mentor created successfully!");
      }
      
      clearDraft();
      setTimeout(() => setSuccess(null), 5000);
      
      setIsModalOpen(false);
      setEditingMentor(null);
      setFormData({ name: '', role: '', description: '', imageUrl: '', linkedinUrl: '' });
      fetchMentors();
    } catch (err: any) {
      console.error("Error saving mentor:", err);
      const statusCode = err?.response?.status;
      if (statusCode === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setError(`Access denied. You need ADMIN permissions. Your current role is: ${userRole || 'Unknown'}`);
      } else {
        setError(err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to save mentor. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setError(null);
    setFormData({
      name: mentor.name,
      role: mentor.role,
      description: mentor.description,
      imageUrl: mentor.imageUrl,
      linkedinUrl: mentor.linkedinUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this mentor?')) {
      try {
        await mentorService.delete(id);
        setMentors(mentors.filter(m => m.id !== id));
      } catch (error) {
        console.error("Error deleting mentor:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search mentors..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setEditingMentor(null);
            setError(null);
            setFormData({ name: '', role: '', description: '', imageUrl: '', linkedinUrl: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          <span>Add New Mentor</span>
        </button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center space-x-3 shadow-sm"
          >
            <CheckCircle2 size={20} />
            <span className="font-medium">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-white rounded-[40px] animate-pulse" />
          ))
        ) : mentors.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-[40px] border border-dashed border-gray-200">
            No mentors added yet. Click "Add New Mentor" to get started.
          </div>
        ) : (
          mentors.map((mentor) => (
            <div 
              key={mentor.id} 
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={resolveImageUrl(mentor.imageUrl) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'} 
                  alt={mentor.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex space-x-2 z-20">
                  <button 
                    onClick={() => handleEdit(mentor)}
                    className="p-2 bg-white/90 backdrop-blur-md text-gray-900 rounded-xl hover:bg-white shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(mentor.id)}
                    className="p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-50 shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 text-center flex-grow flex flex-col">
                <h3 className="font-bold text-secondary text-lg mb-1">{mentor.name}</h3>
                <p className="text-primary font-bold text-xs mb-4 uppercase tracking-widest">{mentor.role}</p>

                <div className="flex-grow mb-6">
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">
                    {mentor.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-center">
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold">{editingMentor ? 'Edit Mentor' : 'Add New Mentor'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium flex items-center space-x-3">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {showDraftPrompt && !editingMentor && (
                  <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl border border-orange-100 text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText size={20} />
                      <span>You have an unsaved draft.</span>
                    </div>
                    <div className="flex space-x-2">
                       <button 
                         type="button" 
                         onClick={loadDraft}
                         className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
                       >
                         Load
                       </button>
                       <button 
                         type="button" 
                         onClick={() => { clearDraft(); setShowDraftPrompt(false); }}
                         className="px-3 py-1 bg-white border border-orange-200 rounded-lg hover:bg-orange-100 transition-all text-orange-700"
                       >
                         Clear
                       </button>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Anant Kulkarni"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role/Designation</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Senior Java Developer"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      placeholder="Brief bio or expertise..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mentor Image</label>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative flex-grow">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Paste Image URL or Upload below..."
                            value={formData.imageUrl}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                          />
                        </div>
                        <label className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all cursor-pointer whitespace-nowrap border-2 border-dashed border-gray-200 hover:border-primary/30">
                          <Plus size={20} className="mr-2 text-primary" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > MAX_IMAGE_SIZE_BYTES) {
                                  alert(`Image size should be less than ${MAX_IMAGE_SIZE_MB}MB`);
                                  return;
                                }
                                try {
                                  const base64 = await compressImage(file);
                                  setFormData({ ...formData, imageUrl: base64 });
                                } catch (error) {
                                  console.error("Error uploading image:", error);
                                  alert("Error uploading image. Please try again.");
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      
                      {formData.imageUrl && (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                           <img src={resolveImageUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                           <button 
                             type="button"
                             onClick={() => setFormData({ ...formData, imageUrl: '' })}
                             className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-md active:scale-90"
                             title="Remove image"
                           >
                             <X size={12} />
                           </button>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-gray-400 font-medium">
                        Supports high-quality HD images (up to {MAX_IMAGE_SIZE_MB}MB). Images are automatically optimized for web performance.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn Profile URL</label>
                    <div className="relative">
                      <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="https://linkedin.com/in/..."
                        value={formData.linkedinUrl}
                        onChange={e => setFormData({...formData, linkedinUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveToDraft}
                    className="flex-grow sm:flex-grow-0 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
                  >
                    <FileText size={20} />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-grow sm:flex-grow-0 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{isSubmitting ? 'Saving...' : editingMentor ? 'Update Mentor' : 'Save Mentor'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMentors;
