import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { leadService } from '../../services/api';

const AdminLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await leadService.getAll();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.delete(id);
        setLeads(leads.filter(l => l.id !== id));
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.mobileNumber?.includes(searchTerm) ||
    lead.cityName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Full Name', 'Course', 'Mobile', 'Email', 'Education', 'City', 'Date'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.fullName}"`,
        `"${lead.courseInterested || 'General'}"`,
        `"${lead.mobileNumber}"`,
        `"${lead.email || ''}"`,
        `"${lead.education}"`,
        `"${lead.cityName}"`,
        `"${new Date(lead.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone or city..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all">
            <Filter size={20} />
            <span>Filter</span>
          </button>
          <button 
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-all"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Student Details</th>
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Education & City</th>
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-6 h-20 bg-gray-50/20" />
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-500">
                    No leads found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-50 text-primary rounded-2xl flex items-center justify-center font-bold text-xl">
                          {lead.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{lead.fullName}</p>
                          <p className="text-xs text-primary font-medium">{lead.courseInterested || 'General Inquiry'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {lead.mobileNumber}
                        </div>
                        {lead.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap size={14} className="mr-2 text-gray-400" />
                          {lead.education}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={14} className="mr-2 text-gray-400" />
                          {lead.cityName}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeads;
