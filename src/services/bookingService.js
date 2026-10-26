import api from './api';

// GET /api/v1/nanny/bookings?status=pending
export const getPendingBookings = async () => {
  return await api.get('/nanny/bookings?status=pending');
};

// GET /api/v1/nanny/bookings?status=confirmed
export const getConfirmedBookings = async () => {
  return await api.get('/nanny/bookings?status=confirmed');
};

// GET /api/v1/nanny/bookings?status=ongoing
export const getOngoingBookings = async () => {
  return await api.get('/nanny/bookings?status=ongoing');
};

// GET /api/v1/nanny/bookings?status=onrunning
export const getOnrunningBookings = async () => {
  return await api.get('/nanny/bookings?status=onrunning');
};

// GET /api/v1/nanny/bookings?status=completed
export const getCompletedBookings = async () => {
  return await api.get('/nanny/bookings?status=completed');
};

// GET /api/v1/nanny/bookings?status=cancelled
export const getCancelledBookings = async () => {
  return await api.get('/nanny/bookings?status=cancelled');
};

// GET /api/v1/nanny/bookings/:id
export const getBookingDetailAsNanny = async (id) => {
  return await api.get(`/nanny/bookings/${id}`);
};

// PATCH /api/v1/nanny/bookings/:id/start
export const startBookingApi = async (id) => {
  return await api.patch(`/nanny/bookings/${id}/start`);
};

// PATCH /api/v1/nanny/bookings/:id/start-running
export const startRunningApi = async (id, otp) => {
  return await api.patch(`/nanny/bookings/${id}/start-running`, { otp });
};

// PATCH /api/v1/nanny/bookings/:id/confirm
export const confirmBooking = async (id) => {
  return await api.patch(`/nanny/bookings/${id}/confirm`);
};

// PATCH /api/v1/nanny/bookings/:id/reject
export const rejectBooking = async (id, reason = "Not available on that date") => {
  return await api.patch(`/nanny/bookings/${id}/reject`, { cancellationReason: reason });
};

// PATCH /api/v1/nanny/bookings/:id/complete
export const completeBooking = async (id, otp) => {
  return await api.patch(`/nanny/bookings/${id}/complete`, { otp });
};

// POST /api/v1/nanny/bookings/:id/send-start-otp
export const sendStartOtpApi = async (id, shiftId = null) => {
  return await api.post(`/nanny/bookings/${id}/send-start-otp`, { shiftId });
};

// POST /api/v1/nanny/bookings/:id/send-end-otp
export const sendEndOtpApi = async (id, shiftId = null) => {
  return await api.post(`/nanny/bookings/${id}/send-end-otp`, { shiftId });
};

// ── MULTI-DAY SHIFT APIs ─────────────────────────────────

// GET /api/v1/nanny/shift/:bookingId/today
export const getTodayShiftContextApi = async (bookingId) => {
  return await api.get(`/nanny/shift/${bookingId}/today`);
};

// POST /api/v1/nanny/shift/start
export const startShiftApi = async (shiftId, otp, location) => {
  return await api.post(`/nanny/shift/start`, { shiftId, otp, location });
};

// POST /api/v1/nanny/shift/end
export const endShiftApi = async (shiftId, otp = null) => {
  return await api.post(`/nanny/shift/end`, { shiftId, otp });
};
