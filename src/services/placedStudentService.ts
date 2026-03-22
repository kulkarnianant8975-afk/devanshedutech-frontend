import axios from 'axios';

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

const API_URL = '/api/placed-students';

export const placedStudentService = {
  getAll: async () => {
    const response = await axios.get<PlacedStudent[]>(API_URL);
    return response.data;
  },

  create: async (data: PlacedStudentRequest) => {
    const response = await axios.post<PlacedStudent>(API_URL, data);
    return response.data;
  },

  update: async (id: string, data: PlacedStudentRequest) => {
    const response = await axios.put<PlacedStudent>(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
  }
};
