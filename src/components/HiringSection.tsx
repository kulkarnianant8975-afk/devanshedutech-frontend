import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { hiringService } from '../services/api';

const HiringSection = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await hiringService.getAll();
        // Limit to 3 for the section
        setPosts(data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching hiring posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Placement Cell</h2>
            <h3 className="text-4xl font-bold">Latest Hiring Posts</h3>
          </div>
          <p className="text-gray-500 max-w-md mt-4 md:mt-0">
            We connect our students with top companies. Check out the latest opportunities from our partner network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse shadow-sm" />
            ))
          ) : (
            posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {post.type}
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h4>
                <div className="space-y-2 mb-8">
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 size={14} className="mr-2" />
                    {post.company}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin size={14} className="mr-2" />
                    {post.location}
                  </div>
                </div>
                {post.link ? (
                  <a 
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold flex items-center justify-center hover:bg-primary hover:text-white transition-all group/link"
                  >
                    <span>Apply Now</span>
                    <ExternalLink size={16} className="ml-2 transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
                  </a>
                ) : (
                  <button className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                    Contact Admin to Apply
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default HiringSection;
