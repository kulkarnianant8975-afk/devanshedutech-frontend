import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

const instagramPosts = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
    likes: '176',
    comments: '3',
    caption: 'Overwhelmed with gratitude for all the love you\'ve shown. Thank you. 🙏 #student #teacher #engineering #bca #coding #parbhani',
    link: 'https://www.instagram.com/p/DSQDs0wk3lV/'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
    likes: '792',
    comments: '1',
    caption: 'Ganpati Bappa Morya 🙌🏻😊 May lord ganesha bless us with wisdom, strength & prosperity #ganeshchaturthi #MadhavSharma #celebration',
    link: 'https://www.instagram.com/p/DN25hQmWFII/'
  },
  {
    id: 3,
    image: '/images/instagram/post3_new.jpg',
    likes: '245',
    comments: '18',
    caption: 'Jai Hind 🇮🇳 Proud to celebrate the spirit of independence and the journey of our nation! #independenceday #india',
    link: 'https://www.instagram.com/p/DNXtoQjtt5s/'
  },
  {
    id: 4,
    image: '/images/instagram/post4.jpg',
    likes: '80',
    comments: '2',
    caption: 'One day Workshop on DATA SCIENCE & AI at Late Sow. Kmalatai Jamkar Mahila Mahavidyalaya, Parbhani. Empowering the next generation! 📊🎓',
    link: 'https://www.instagram.com/reel/DTO5z81iOkO/'
  },
  {
    id: 5,
    image: '/images/instagram/post5.jpg',
    likes: '62',
    comments: '58',
    caption: 'Get internships/jobs/freelance work easily. Your career starts here with the right guidance! 💼✨ #placement #hiring',
    link: 'https://www.instagram.com/reel/DWEQSPOjIIC/'
  },
  {
    id: 6,
    image: '/images/instagram/post6.jpg',
    likes: '92',
    comments: '10',
    caption: 'Start Today! Don\'t wait for the perfect moment. Take the first step towards your tech career now! 💻🔥 #coding #motivation',
    link: 'https://www.instagram.com/reel/DUsxv7UjLBY/'
  }
];

const InstagramFeed = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center space-x-2 text-primary font-bold uppercase tracking-widest text-sm mb-4">
              <Instagram size={18} />
              <span>Follow Us on Instagram</span>
            </div>
            <h2 className="text-4xl font-bold">Life at Devansh-Edutech</h2>
          </div>
          <a 
            href="https://www.instagram.com/madhav_sharma0508?igsh=MXFnMGNqZDE0ZmtpOQ==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 md:mt-0 inline-flex items-center space-x-2 text-gray-600 hover:text-primary font-semibold transition-colors"
          >
            <span>View Profile</span>
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="relative">
          <motion.div 
            className="flex space-x-6"
            animate={{ x: [0, -1872] }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ width: 'fit-content' }}
          >
            {[...instagramPosts, ...instagramPosts].map((post, idx) => (
              <a 
                key={`${post.id}-${idx}`}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group w-72 h-72 flex-shrink-0 rounded-3xl overflow-hidden shadow-lg"
              >
                <img 
                  src={post.image} 
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-6 text-center">
                  <div className="flex space-x-6 mb-4">
                    <div className="flex items-center space-x-1">
                      <Heart size={20} fill="currentColor" />
                      <span className="font-bold">{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle size={20} fill="currentColor" />
                      <span className="font-bold">{post.comments}</span>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3 font-medium">{post.caption}</p>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
