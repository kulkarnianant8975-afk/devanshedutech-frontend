import api from './api';

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

const API_URL = '/mentors';

export const mentorService = {
  getAll: async () => {
    const response = await api.get<Mentor[]>(API_URL);
    return response.data;
  },

  create: async (data: MentorRequest) => {
    const response = await api.post<Mentor>(API_URL, data);
    return response.data;
  },

  update: async (id: string, data: MentorRequest) => {
    const response = await api.put<Mentor>(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`${API_URL}/${id}`);
  }
};
