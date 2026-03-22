/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Code, Database, Globe, Layout, MessageSquare, Smartphone, TrendingUp } from "lucide-react";

export interface Course {
  id: string;
  name: string;
  duration: string;
  fee: string;
  description: string;
  category: string;
  icon: any;
  image?: string;
}

export const courses: Course[] = [
  {
    id: "1",
    name: "Foundation using C, C++",
    duration: "2 Months",
    fee: "₹4,999",
    description: "Master the fundamentals of programming with C and C++. Perfect for beginners to build a strong logic base.",
    category: "Programming",
    icon: Code,
  },
  {
    id: "2",
    name: "Full Stack Web Development",
    duration: "6 Months",
    fee: "₹24,999",
    description: "Become a professional web developer. Learn HTML, CSS, JS, React, Node.js, and MongoDB.",
    category: "Web Development",
    icon: Globe,
  },
  {
    id: "3",
    name: "Full Stack Python Development",
    duration: "5 Months",
    fee: "₹19,999",
    description: "Learn Python from scratch to advanced levels, including Django/Flask for web development.",
    category: "Python",
    icon: Layout,
  },
  {
    id: "4",
    name: "Full Stack Java Development",
    duration: "6 Months",
    fee: "₹24,999",
    description: "Master Java, Spring Boot, and Microservices to build enterprise-level applications.",
    category: "Java",
    icon: Database,
  },
  {
    id: "5",
    name: "Software Testing",
    duration: "3 Months",
    fee: "₹12,999",
    description: "Learn Manual and Automation testing using Selenium, Java, and TestNG.",
    category: "Testing",
    icon: Smartphone,
  },
  {
    id: "6",
    name: "Digital Marketing",
    duration: "3 Months",
    fee: "₹9,999",
    description: "Master SEO, SEM, Social Media Marketing, and Content Strategy.",
    category: "Marketing",
    icon: TrendingUp,
  },
  {
    id: "7",
    name: "Soft Skills",
    duration: "1 Month",
    fee: "₹3,999",
    description: "Enhance your personality, time management, and professional ethics.",
    category: "Professional",
    icon: BookOpen,
  },
  {
    id: "8",
    name: "Communication Skills",
    duration: "1 Month",
    fee: "₹3,999",
    description: "Improve your verbal and non-verbal communication for better career growth.",
    category: "Professional",
    icon: MessageSquare,
  },
];
