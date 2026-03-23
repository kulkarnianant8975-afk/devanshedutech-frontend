import axios from 'axios';
import { 
  CourseRequestDTO, 
  CourseResponseDTO, 
  LeadRequestDTO, 
  LeadResponseDTO, 
  UserResponseDTO,
  HiringRequestDTO,
  HiringResponseDTO
} from '../dtos';

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

const api = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
  withCredentials: true, // Required for sessions
});

export const courseService = {
  getAll: () => api.get<CourseResponseDTO[]>('/courses').then(res => res.data),
  create: (course: CourseRequestDTO) => api.post<CourseResponseDTO>('/courses', course).then(res => res.data),
  update: (id: string, course: Partial<CourseRequestDTO>) => api.put<CourseResponseDTO>(`/courses/${id}`, course).then(res => res.data),
  delete: (id: string) => api.delete(`/courses/${id}`).then(res => res.data),
};

export const leadService = {
  getAll: () => api.get<LeadResponseDTO[]>('/leads').then(res => res.data),
  create: (lead: LeadRequestDTO) => api.post<LeadResponseDTO>('/leads', lead).then(res => res.data),
  updateStatus: (id: string, status: string) => api.patch<LeadResponseDTO>(`/leads/${id}/status`, { status }).then(res => res.data),
  delete: (id: string) => api.delete(`/leads/${id}`).then(res => res.data),
  getStats: () => api.get('/stats').then(res => res.data),
};

export const hiringService = {
  getAll: () => api.get<HiringResponseDTO[]>('/hiring').then(res => res.data),
  create: (post: HiringRequestDTO) => api.post<HiringResponseDTO>('/hiring', post).then(res => res.data),
  update: (id: string, post: Partial<HiringRequestDTO>) => api.put<HiringResponseDTO>(`/hiring/${id}`, post).then(res => res.data),
  delete: (id: string) => api.delete(`/hiring/${id}`).then(res => res.data),
};

export const authService = {
  getMe: () => api.get<UserResponseDTO>('/auth/me').then(res => {
    console.log('Auth getMe response:', res.data);
    return res.data;
  }).catch(err => {
    console.error('Auth getMe error:', err.response?.status, err.response?.data);
    throw err;
  }),
  updateProfilePicture: (photoUrl: string) => api.put<UserResponseDTO>('/auth/profile-picture', { photoUrl }).then(res => res.data),
  login: (credentials: any) => api.post<UserResponseDTO>('/auth/login', credentials).then(res => res.data),
  register: (data: any) => api.post<UserResponseDTO>('/auth/register', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  loginWithGoogle: () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    
    return window.open(
      `${backendUrl}/oauth2/authorization/google`,
      'google_oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  }
};

export const settingsService = {
  getBrochure: () => api.get<{downloadUrl: string}>('/public/brochure').then(res => res.data),
  uploadBrochure: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/settings/brochure/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  getCourseBrochure: (courseId: string) => api.get<{downloadUrl: string}>(`/public/brochure/${courseId}`).then(res => res.data),
  uploadCourseBrochure: (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/settings/brochure/upload/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

export default api;
