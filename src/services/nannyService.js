import api from './api';

// GET /nanny/profile
export const getMyProfile = () => api.get('/nanny/profile');

// PATCH /nanny/profile
export const updateMyProfile = (data) => api.patch('/nanny/profile', data);

// POST /nanny/service-areas
export const addServiceArea = (data) => api.post('/nanny/service-areas', data);

// GET /nanny/service-areas
export const getServiceAreas = () => api.get('/nanny/service-areas');

// GET /nanny/schedule
export const getWorkingSchedule = () => api.get('/nanny/schedule');

// POST /nanny/schedule
export const updateWorkingSchedule = (data) => api.post('/nanny/schedule', data);

// GET /nanny/leaves
export const getLeaves = () => api.get('/nanny/leaves');

// POST /nanny/leaves
export const addLeave = (data) => api.post('/nanny/leaves', data);

// DELETE /nanny/leaves/:id
export const deleteLeave = (id) => api.delete('/nanny/leaves/' + id);
