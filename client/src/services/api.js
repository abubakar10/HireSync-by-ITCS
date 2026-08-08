import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hiresync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    const errors = error.response?.data?.errors || [];
    const status = error.response?.status;

    if (status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('hiresync_token');
        localStorage.removeItem('hiresync_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    return Promise.reject({ message, errors, status, raw: error });
  }
);

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  recruiters: (params) => api.get('/users/recruiters', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post('/jobs', payload),
  update: (id, payload) => api.patch(`/jobs/${id}`, payload),
  publish: (id) => api.post(`/jobs/${id}/publish`),
  remove: (id) => api.delete(`/jobs/${id}`),
  dashboardStats: () => api.get('/jobs/stats/dashboard'),
};

export const candidatesApi = {
  list: (params) => api.get('/candidates', { params }),
  sources: () => api.get('/candidates/sources'),
  pipeline: (params) => api.get('/candidates/pipeline', { params }),
  get: (id) => api.get(`/candidates/${id}`),
  create: (payload) => api.post('/candidates', payload),
  update: (id, payload) => api.patch(`/candidates/${id}`, payload),
  remove: (id) => api.delete(`/candidates/${id}`),
};

export const distributionApi = {
  boards: () => api.get('/distribution/boards'),
  list: (params) => api.get('/distribution', { params }),
  forJob: (jobId) => api.get(`/distribution/job/${jobId}`),
  history: (jobId, params) => api.get(`/distribution/job/${jobId}/history`, { params }),
  publish: (payload) => api.post('/distribution/publish', payload),
  close: (id) => api.post(`/distribution/${id}/close`),
};

export const integrationsApi = {
  list: () => api.get('/integrations'),
  get: (id) => api.get(`/integrations/${id}`),
  update: (id, payload) => api.patch(`/integrations/${id}`, payload),
  test: (id) => api.post(`/integrations/${id}/test`),
  simulateOptions: () => api.get('/integrations/simulate-options'),
  simulate: (payload) => api.post('/integrations/simulate-application', payload),
  adminStats: () => api.get('/integrations/stats/admin'),
};

export const activityApi = {
  list: (params) => api.get('/activity', { params }),
  integrationLogs: (params) => api.get('/activity/integration-logs', { params }),
};

export default api;
