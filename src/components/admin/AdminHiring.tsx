import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Briefcase,
  MapPin,
  Building2,
  Clock,
  X,
  Save,
  DollarSign
} from 'lucide-react';
import { hiringService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminHiring = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    salary: '',
    link: ''
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await hiringService.getAll();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching hiring posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await hiringService.update(editingPost.id, formData);
      } else {
        await hiringService.create(formData);
      }
      setIsModalOpen(false);
      setEditingPost(null);
      setFormData({ title: '', company: '', location: '', type: 'Full-time', description: '', requirements: '', salary: '', link: '' });
      fetchPosts();
    } catch (error) {
      console.error("Error saving hiring post:", error);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      company: post.company,
      location: post.location,
      type: post.type,
      description: post.description,
      requirements: post.requirements,
      salary: post.salary || '',
      link: post.link || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hiring post?')) {
      try {
        await hiringService.delete(id);
        setPosts(posts.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting hiring post:", error);
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
            placeholder="Search jobs..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setEditingPost(null);
            setFormData({ title: '', company: '', location: '', type: 'Full-time', description: '', requirements: '', salary: '', link: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-[40px] animate-pulse" />
          ))
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-gray-500 bg-white rounded-[40px] border border-dashed border-gray-200">
            No hiring posts yet. Click "Post New Job" to get started.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-orange-50 text-primary rounded-3xl flex items-center justify-center">
                  <Briefcase size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{post.title}</h4>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Building2 size={16} className="mr-1" />
                      {post.company}
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {post.location}
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {post.type}
                    </div>
                    {post.salary && (
                      <div className="flex items-center text-emerald-600 font-medium">
                        <DollarSign size={16} className="mr-1" />
                        {post.salary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleEdit(post)}
                  className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
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
                <h3 className="text-2xl font-bold">{editingPost ? 'Edit Job Post' : 'Post New Job'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Tech Solutions Inc"
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. Pune, Remote"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Job Type</label>
                    <select
                      required
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Salary Range (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. ₹8L - ₹12L PA"
                      value={formData.salary}
                      onChange={e => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Job Link / Application URL (Optional)</label>
                    <input
                      type="url"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="e.g. https://company.com/apply"
                      value={formData.link}
                      onChange={e => setFormData({...formData, link: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Job Description</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      placeholder="Detailed job description..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Requirements</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      placeholder="Key requirements and qualifications..."
                      value={formData.requirements}
                      onChange={e => setFormData({...formData, requirements: e.target.value})}
                    />
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
                    <span>{editingPost ? 'Update Post' : 'Post Job'}</span>
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

export default AdminHiring;
