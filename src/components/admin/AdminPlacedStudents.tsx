import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Briefcase,
  Quote,
  X,
  Save,
  Loader2,
  DollarSign
} from 'lucide-react';
import { placedStudentService } from '../../services/placedStudentService';
import { PlacedStudentResponseDTO as PlacedStudent } from '../../dtos';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, resolveImageUrl, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '../../utils/imageUtils';

const AdminPlacedStudents = () => {
  const [students, setStudents] = useState<PlacedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<PlacedStudent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    salaryPackage: '',
    testimonial: '',
    imageUrl: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await placedStudentService.getAll();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching placed students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingStudent) {
        await placedStudentService.update(editingStudent.id, formData);
      } else {
        await placedStudentService.create(formData);
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({ name: '', company: '', role: '', salaryPackage: '', testimonial: '', imageUrl: '' });
      fetchStudents();
    } catch (err: any) {
      console.error("Error saving student:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to save student. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: PlacedStudent) => {
    setEditingStudent(student);
    setError(null);
    setFormData({
      name: student.name,
      company: student.company,
      role: student.role,
      salaryPackage: student.salaryPackage,
      testimonial: student.testimonial,
      imageUrl: student.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this success story?')) {
      try {
        await placedStudentService.delete(id);
        setStudents(students.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting student:", error);
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
            placeholder="Search alumni..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setError(null);
            setFormData({ name: '', company: '', role: '', salaryPackage: '', testimonial: '', imageUrl: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          <span>Add Success Story</span>
        </button>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-white rounded-[40px] animate-pulse" />
          ))
        ) : students.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-[40px] border border-dashed border-gray-200">
            No success stories added yet. Click "Add Success Story" to get started.
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={resolveImageUrl(student.imageUrl) || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'} 
                  alt={student.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex space-x-2 z-20">
                  <button 
                    onClick={() => handleEdit(student)}
                    className="p-2 bg-white/90 backdrop-blur-md text-gray-900 rounded-xl hover:bg-white shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-50 shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute top-4 left-4 text-white/50">
                  <Quote size={24} />
                </div>
              </div>
              
              <div className="p-6 text-center flex-grow flex flex-col">
                <h4 className="font-extrabold text-secondary text-lg mb-1">{student.name}</h4>
                <p className="text-primary font-bold text-xs mb-4 uppercase tracking-widest">{student.company}</p>

                <div className="flex-grow mb-6">
                  <p className="text-gray-500 text-xs italic">
                    "{student.testimonial}"
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="text-left">
                    <p className="text-gray-400 font-bold uppercase tracking-tighter">Role</p>
                    <p className="font-bold text-secondary truncate">{student.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 font-bold uppercase tracking-tighter">Package</p>
                    <p className="font-black text-emerald-600">{student.salaryPackage}</p>
                  </div>
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
              className="relative bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold">{editingStudent ? 'Edit Success Story' : 'Add Success Story'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Student Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. TCS / Google"
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Designation / Role</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Salary Package</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 12 LPA"
                        value={formData.salaryPackage}
                        onChange={e => setFormData({...formData, salaryPackage: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Testimonial / Success Quote</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      placeholder="Their experience with Devansh Edu-Tech..."
                      value={formData.testimonial}
                      onChange={e => setFormData({...formData, testimonial: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Student Image</label>
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
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{isSubmitting ? 'Saving...' : editingStudent ? 'Update Story' : 'Save Story'}</span>
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

export default AdminPlacedStudents;
