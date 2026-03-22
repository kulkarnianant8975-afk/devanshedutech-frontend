// Course DTOs
export interface CourseRequestDTO {
  name: string;
  description: string;
  duration: string;
  price: number;
  category: string;
  image?: string;
}

export interface CourseResponseDTO {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  category: string;
  image?: string;
}

// Lead DTOs
export interface LeadRequestDTO {
  fullName: string;
  email?: string;
  mobileNumber: string;
  education: string;
  cityName: string;
  courseInterested?: string;
}

export interface LeadResponseDTO {
  id: string;
  fullName: string;
  email?: string;
  mobileNumber: string;
  education: string;
  cityName: string;
  courseInterested?: string;
  status: string;
  createdAt: string;
}

// User DTOs
export interface UserResponseDTO {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
}

// Hiring DTOs
export interface HiringRequestDTO {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary?: string;
  link?: string;
}

export interface HiringResponseDTO {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary?: string;
  link?: string;
  createdAt: string;
}

// Mentor DTOs
export interface MentorRequestDTO {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl?: string;
}

export interface MentorResponseDTO {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl?: string;
  createdAt: string;
}

// Placed Student DTOs
export interface PlacedStudentRequestDTO {
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
}

export interface PlacedStudentResponseDTO {
  id: string;
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
  createdAt: string;
}
// Stats DTOs
export interface StatsResponse {
  totalLeads: number;
  totalCourses: number;
  totalHiring: number;
  totalMentors: number;
  totalPlacedStudents: number;
  monthlyLeads: MonthlyLead[];
}

export interface MonthlyLead {
  name: string;
  leads: number;
}
