import api from './api';

// ── Nanny Profile ────────────────────────────────────────────────
export const getMyProfile      = ()       => api.get('/nanny/profile');
export const createMyProfile   = (data)   => api.post('/nanny/profile', data);
export const updateMyProfile   = (data)   => api.patch('/nanny/profile', data);

// ── Nanny Service Areas ──────────────────────────────────────────
// POST body: { serviceAreaId, radiusKm }
export const addServiceArea    = (data)   => api.post('/nanny/service-areas', data);
export const getServiceAreas   = ()       => api.get('/nanny/service-areas');
export const deleteServiceArea = (areaId) => api.delete(`/nanny/service-areas/${areaId}`);

// ── Public Location Dropdowns (NO auth required) ─────────────────
// Used in the "Add Service Area" screen to show admin-created locations
export const getCountries         = ()           => api.get('/locations/countries');
export const getStates            = (countryId)  => api.get(`/locations/states?countryId=${countryId}`);
export const getCities            = (stateId)    => api.get(`/locations/cities?stateId=${stateId}`);
export const getAdminServiceAreas = (cityId)     => api.get(`/locations/service-areas?cityId=${cityId}`);

// ── Working Schedule ─────────────────────────────────────────────
export const getWorkingSchedule    = ()     => api.get('/nanny/schedule');
export const updateWorkingSchedule = (data) => api.post('/nanny/schedule', data);

// ── Leaves ────────────────────────────────────────────────────────
export const getLeaves   = ()     => api.get('/nanny/leaves');
export const addLeave    = (data) => api.post('/nanny/leaves', data);
export const deleteLeave = (id)   => api.delete('/nanny/leaves/' + id);
