import api from './api';

export interface PlacedStudent {
  id: string;
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
  createdAt: string;
}

export interface PlacedStudentRequest {
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
}

const API_URL = '/placed-students';

export const placedStudentService = {
  getAll: async () => {
    const response = await api.get<PlacedStudent[]>(API_URL);
    return response.data;
  },

  create: async (data: PlacedStudentRequest) => {
    const response = await api.post<PlacedStudent>(API_URL, data);
    return response.data;
  },

  update: async (id: string, data: PlacedStudentRequest) => {
    const response = await api.put<PlacedStudent>(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`${API_URL}/${id}`);
  }
};
