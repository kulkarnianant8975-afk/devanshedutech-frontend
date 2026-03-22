import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Clock,
  Layers,
  Tag,
  X,
  Save,
  Download,
  Loader2
} from 'lucide-react';
import { courseService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '../../utils/imageUtils';

const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [uploadingCourseId, setUploadingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    level: '',
    category: '',
    price: '',
    image: '',
    isActive: true
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getAll();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceValue = typeof formData.price === 'string' 
        ? parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0 
        : formData.price;

      const courseData = {
        name: formData.name,
        description: formData.description,
        duration: formData.duration,
        category: formData.category,
        price: priceValue,
        image: formData.image
      };

      if (editingCourse) {
        await courseService.update(editingCourse.id, courseData);
      } else {
        await courseService.create(courseData);
      }
      setIsModalOpen(false);
      setEditingCourse(null);
      setFormData({ name: '', description: '', duration: '', level: '', category: '', price: '', image: '', isActive: true });
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      duration: course.duration,
      level: course.level || 'Beginner',
      category: course.category,
      price: course.price?.toString() || '',
      image: course.image || '',
      isActive: course.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.delete(id);
        setCourses(courses.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting course:", error);
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
            placeholder="Search courses..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setEditingCourse(null);
            setFormData({ name: '', description: '', duration: '', level: '', category: '', price: '', image: '', isActive: true });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-[40px] animate-pulse" />
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-[40px] border border-dashed border-gray-200">
            No courses added yet. Click "Add New Course" to get started.
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800'} 
                  alt={course.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <label className={`cursor-pointer p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg transition-all ${
                    uploadingCourseId === course.id ? 'text-gray-400' : 'text-orange-500 hover:bg-orange-50'
                  }`} title="Upload Brochure">
                    {uploadingCourseId === course.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} className="rotate-180" />
                    )}
                    <input 
                      disabled={uploadingCourseId === course.id}
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            alert('Please select a PDF smaller than 50MB.');
                            return;
                          }
                          setUploadingCourseId(course.id);
                          try {
                            const api = await import('../../services/api');
                            await api.settingsService.uploadCourseBrochure(course.id, file);
                            alert(`Brochure uploaded successfully for ${course.name}`);
                          } catch (err) {
                            console.error('Failed to upload brochure', err);
                            alert('Failed to upload brochure.');
                          } finally {
                            setUploadingCourseId(null);
                            e.target.value = ''; // Reset input
                          }
                        }
                      }} 
                    />
                  </label>
                  <button 
                    onClick={() => handleEdit(course)}
                    className="p-2 bg-white/90 backdrop-blur-md text-gray-900 rounded-xl shadow-lg hover:bg-white transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id)}
                    className="p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest">
                    {course.category}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h4 className="text-xl font-bold mb-2 line-clamp-1">{course.name}</h4>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock size={14} className="mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Layers size={14} className="mr-1" />
                      {course.level}
                    </div>
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
                <h3 className="text-2xl font-bold">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Course Title</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Full Stack Web Development"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      placeholder="Course overview and syllabus..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 6 Months"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Level</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        required
                        className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                        value={formData.level}
                        onChange={e => setFormData({...formData, level: e.target.value})}
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. Web Development"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Price</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. ₹25,000"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Course Image</label>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative flex-grow">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Paste Image URL or Upload below..."
                            value={formData.image}
                            onChange={e => setFormData({...formData, image: e.target.value})}
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
                                  setFormData({ ...formData, image: base64 });
                                } catch (error) {
                                  console.error("Error uploading image:", error);
                                  alert("Error uploading image. Please try again.");
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      
                      {formData.image && (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                           <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                           <button 
                             type="button"
                             onClick={() => setFormData({ ...formData, image: '' })}
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
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center space-x-2"
                  >
                    <Save size={20} />
                    <span>{editingCourse ? 'Update Course' : 'Save Course'}</span>
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

export default AdminCourses;
