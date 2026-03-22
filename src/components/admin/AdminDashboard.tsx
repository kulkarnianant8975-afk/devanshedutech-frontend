import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Loader2,
  Award
} from 'lucide-react';
import { leadService } from '../../services/api';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCourses: 0,
    totalHiring: 0,
    totalMentors: 0,
    totalPlacedStudents: 0,
    monthlyLeads: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await leadService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'blue', trend: '+12%' },
    { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'orange', trend: '+2' },
    { label: 'Total Mentors', value: stats.totalMentors, icon: Users, color: 'purple', trend: 'New' },
    { label: 'Placed Students', value: stats.totalPlacedStudents, icon: Award, color: 'green', trend: 'Live' },
    { label: 'Hiring Posts', value: stats.totalHiring, icon: Briefcase, color: 'emerald', trend: '+5' },
    { label: 'Conversion Rate', value: '24%', icon: TrendingUp, color: 'rose', trend: '+3.2%' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} className="mr-1" />
                {card.trend}
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{card.label}</p>
            <h4 className="text-3xl font-bold text-gray-900 mt-1">{card.value}</h4>
          </div>
        ))}
      </div>

      {/* Project Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Project ID</p>
            <p className="text-lg font-bold text-gray-900">devanshedutech-5d749</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Server size={32} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Environment</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">Production</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">LIVE</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
              <BookOpen size={32} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Global Assets</p>
              <h4 className="text-lg font-bold text-gray-900">Course Brochure PDF</h4>
              <p className="text-sm text-gray-500">Students download this file after form submission.</p>
            </div>
          </div>
          <label className={`cursor-pointer w-full md:w-auto px-6 py-3 bg-primary text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-100 flex items-center justify-center space-x-2 ${
            isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'
          }`}>
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Upload Brochure (PDF)</span>
              </>
            )}
            <input 
              disabled={isUploading}
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
                    setIsUploading(true);
                    try {
                      const s = await import('../../services/api').then(m => m.settingsService);
                      await s.uploadBrochure(file);
                      alert('Brochure uploaded successfully! Students will now get this version.');
                    } catch (err) {
                      console.error('Failed to upload brochure', err);
                      alert('Failed to upload brochure.');
                    } finally {
                      setIsUploading(false);
                      e.target.value = ''; // Reset input
                    }
                  }
              }}
            />
          </label>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 md:p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold">Student Inquiries</h4>
              <p className="text-sm text-gray-500">Monthly lead generation overview</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Calendar size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyLeads}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6321" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#FF6321" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold">Course Distribution</h4>
              <p className="text-sm text-gray-500">Leads by course category</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-xl">
              <TrendingUp size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyLeads}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="leads" fill="#FF6321" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
