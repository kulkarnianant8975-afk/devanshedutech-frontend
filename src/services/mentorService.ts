import axios from 'axios';

export interface Mentor {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl: string;
  createdAt: string;
}

export interface MentorRequest {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl: string;
}

const API_URL = '/api/mentors';

export const mentorService = {
  getAll: async () => {
    const response = await axios.get<Mentor[]>(API_URL);
    return response.data;
  },

  create: async (data: MentorRequest) => {
    const response = await axios.post<Mentor>(API_URL, data);
    return response.data;
  },

  update: async (id: string, data: MentorRequest) => {
    const response = await axios.put<Mentor>(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
  }
};
