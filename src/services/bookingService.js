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
