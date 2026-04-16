import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

const instagramPosts = [
  {
    id: 1,
    image: 'https://instagram.fnag1-4.fna.fbcdn.net/v/t51.82787-15/600459708_18422459110115359_5148942868928965891_n.heic?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=Mzc4NzUyNjk2Mzc1MDc0NzcyMQ%3D%3D&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTQ0MC5zZHIuQzMifQ%3D%3D&_nc_ohc=QBfjtTzucS4Q7kNvwE_xAJw&_nc_oc=Adrb4jFPF05Mi8DoQh5FZj0IoARWQo-oyWr77e3VLo5ewFvSMVu20qb_Bj5Dd0cfVAc&_nc_ad=z-m&_nc_cid=2034&_nc_zt=23&_nc_ht=instagram.fnag1-4.fna&_nc_gid=LErdS3ui50aolE6uZeWGBw&_nc_ss=7a32e&oh=00_AfzCvJ1Czj8TL_WFLiNhQGmfH3sbOKGR8JOtNyF4HidpNA&oe=69C5A78E',
    likes: '176',
    comments: '3',
    caption: 'Overwhelmed with gratitude for all the love you’ve shown. Thank you. 🙏 #student #teacher #engineering #bca #coding #parbhani',
    link: 'https://www.instagram.com/p/DSQDs0wk3lV/'
  },
  {
    id: 2,
    image: 'https://instagram.fnag1-4.fna.fbcdn.net/v/t51.82787-15/650515529_17952634656102459_1466027405528680097_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzcwODQwNDMwNTkwMjQ3Mzc4Ng%3D%3D&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTQ0MC5zZHIuQzM1In0%3D&_nc_ohc=yRspvLoi4SwQ7kNvwFqfg5o&_nc_oc=AdqqrnicHYLWpoMbhV34vP1y0XyUUTdik0I4YNPyVi6IsXz-OFtCRO5ne-TmpKsTRz0&_nc_ad=z-m&_nc_cid=2034&_nc_zt=23&_nc_ht=instagram.fnag1-4.fna&_nc_gid=gwOIdkt56_BR5jbLx2K08w&_nc_ss=7a32e&oh=00_Afy0kE_I8kjkS1E7vsrqTBhprJc6gMK1t_2CjPt2oQ9_fA&oe=69C5A8AD',
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
