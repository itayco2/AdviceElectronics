import axios from 'axios';

const API_BASE_URL = 'http://localhost:5091/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const register = (data: { email: string; password: string }) =>
  api.post('/auth/register', data).then((res) => res.data);

export const login = async (data: { email: string; password: string }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.error || err.message || 'Login failed';
    throw new Error(msg);
  }
};

export const getUser = (id: string) =>
  api.get(`/auth/user/${id}`).then((res) => res.data);

export const forgotPassword = (data: { email: string }) =>
  api.post('/auth/forgot-password', data).then((res) => res.data);

export const resetPassword = async (data: { email: string; token: string; newPassword: string }) => {
  try {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.error || err.message || 'Reset failed';
    throw new Error(msg);
  }
};

// --- Buildings ---
export const getBuildingsForUser = (userId: string) =>
  api.get(`/buildings/user/${userId}`).then((res) => res.data);

export const createBuilding = (data: { userId: string; name: string; numberOfFloors: number }) =>
  api.post('/buildings', data).then((res) => res.data);

export const getBuildingById = (id: string) =>
  api.get(`/buildings/${id}`).then((res) => res.data);

export const deleteBuilding = (id: string) =>
  api.delete(`/buildings/${id}`);

// --- Elevators ---
export const getElevatorsForBuilding = (buildingId: string) =>
  api.get(`/elevators/building/${buildingId}`).then((res) => res.data);

export const getElevatorById = (id: string) =>
  api.get(`/elevators/${id}`).then((res) => res.data);

export const updateElevatorStatus = (id: string, data: { status: string; direction: string; doorStatus: string; currentFloor: number }) =>
  api.put(`/elevators/${id}/status`, data).then((res) => res.data);

export const createElevator = (data: { buildingId: string; currentFloor?: number; status?: string; direction?: string; doorStatus?: string }) =>
  api.post('/elevators', data).then((res) => res.data);

export const deleteElevator = (id: string) =>
  api.delete(`/elevators/${id}`);

// --- Elevator Calls ---
export const createElevatorCall = (data: { buildingId: string; requestedFloor: number; destinationFloor?: number }) =>
  api.post('/elevatorcalls', data).then((res) => res.data);

export const getCallsForBuilding = (buildingId: string) =>
  api.get(`/elevatorcalls/building/${buildingId}`).then((res) => res.data);

export const getAssignmentsForCall = (callId: string) =>
  api.get(`/elevatorcalls/${callId}/assignments`).then((res) => res.data);

export const getUsers = async () => {
  const res = await api.get('/auth/users');
  return res.data;
};

export const deleteUser = async (id: string) => {
  await api.delete(`/auth/user/${id}`);
};

export default api; 