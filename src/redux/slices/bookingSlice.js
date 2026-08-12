import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getPendingBookings, getConfirmedBookings, getOngoingBookings, getOnrunningBookings, getCompletedBookings, getCancelledBookings, 
  startBookingApi, startRunningApi, confirmBooking, rejectBooking, completeBooking,
  getTodayShiftContextApi, startShiftApi, endShiftApi
} from '../../services/bookingService';

// Async thunk to fetch pending bookings
export const fetchPendingBookings = createAsyncThunk(
  'booking/fetchPendingBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPendingBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending bookings');
    }
  }
);

// Async thunk to fetch confirmed bookings
export const fetchConfirmedBookings = createAsyncThunk(
  'booking/fetchConfirmedBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getConfirmedBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch confirmed bookings');
    }
  }
);

// Async thunk to fetch ongoing bookings
export const fetchOngoingBookings = createAsyncThunk(
  'booking/fetchOngoingBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getOngoingBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ongoing bookings');
    }
  }
);

// Async thunk to fetch onrunning bookings
export const fetchOnrunningBookings = createAsyncThunk(
  'booking/fetchOnrunningBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getOnrunningBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch onrunning bookings');
    }
  }
);

// Async thunk to fetch completed bookings
export const fetchCompletedBookings = createAsyncThunk(
  'booking/fetchCompletedBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCompletedBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch completed bookings');
    }
  }
);

// Async thunk to fetch cancelled bookings
export const fetchCancelledBookings = createAsyncThunk(
  'booking/fetchCancelledBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCancelledBookings();
      if (response && response.data && response.data.bookings) {
        return response.data.bookings;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cancelled bookings');
    }
  }
);

export const startBooking = createAsyncThunk(
  'booking/startBooking',
  async (id, { rejectWithValue }) => {
    try {
      const response = await startBookingApi(id);
      if (response?.status === 'success') {
        return id;
      }
      throw new Error('Failed to start booking');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error starting booking');
    }
  }
);

export const startRunningBooking = createAsyncThunk(
  'booking/startRunningBooking',
  async ({ id, otp }, { rejectWithValue }) => {
    try {
      const response = await startRunningApi(id, otp);
      if (response?.status === 'success') {
        return id;
      }
      throw new Error('Failed to start session');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error executing start session');
    }
  }
);

export const completeSessionBooking = createAsyncThunk(
  'booking/completeSessionBooking',
  async ({ id, otp }, { rejectWithValue }) => {
    try {
      const response = await completeBooking(id, otp);
      if (response?.status === 'success') {
        return id;
      }
      throw new Error('Failed to complete session');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error executing complete session');
    }
  }
);

// ── MULTI-DAY SHIFT THUNKS ───────────────────────────────────────────────

export const fetchTodayShiftContext = createAsyncThunk(
  'booking/fetchTodayShiftContext',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await getTodayShiftContextApi(bookingId);
      if (response && response.data && response.data.shift !== undefined) {
        return response.data.shift; // might be null if no shift today
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch today shift context');
    }
  }
);

export const startDailyShift = createAsyncThunk(
  'booking/startDailyShift',
  async ({ shiftId, otp, location }, { rejectWithValue }) => {
    try {
      const response = await startShiftApi(shiftId, otp, location);
      if (response?.status === 'success') {
        return response.data.shift;
      }
      throw new Error('Failed to start daily shift');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error starting daily shift');
    }
  }
);

export const endDailyShift = createAsyncThunk(
  'booking/endDailyShift',
  async ({ shiftId }, { rejectWithValue }) => {
    try {
      const response = await endShiftApi(shiftId);
      if (response?.status === 'success') {
        return { shift: response.data.shift, isFullyCompleted: response.data.isBookingFullyCompleted };
      }
      throw new Error('Failed to end daily shift');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error ending daily shift');
    }
  }
);

// Async thunk to accept or decline booking
export const setBookingStatus = createAsyncThunk(
  'booking/setBookingStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      let response;
      if (status === 'confirmed') {
        response = await confirmBooking(id);
      } else if (status === 'cancelled') {
        response = await rejectBooking(id, reason || 'Not available on that date');
      } else if (status === 'completed') {
        response = await completeBooking(id);
      }
      
      if (response?.status === 'success') {
        return { id, status };
      }
      throw new Error('Failed to update status');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating booking');
    }
  }
);

const initialState = {
  pendingBookings: [],
  confirmedBookings: [],
  ongoingBookings: [],
  onrunningBookings: [],
  completedBookings: [],
  cancelledBookings: [],
  activeShift: null, // Tracks the currently active/pending NannyShift context
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPendingBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingBookings = action.payload;
      })
      .addCase(fetchPendingBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Confirmed
      .addCase(fetchConfirmedBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConfirmedBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.confirmedBookings = action.payload;
      })
      .addCase(fetchConfirmedBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Ongoing
      .addCase(fetchOngoingBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOngoingBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ongoingBookings = action.payload;
      })
      .addCase(fetchOngoingBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Onrunning
      .addCase(fetchOnrunningBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOnrunningBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.onrunningBookings = action.payload;
      })
      .addCase(fetchOnrunningBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Completed
      .addCase(fetchCompletedBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompletedBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.completedBookings = action.payload;
      })
      .addCase(fetchCompletedBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Cancelled
      .addCase(fetchCancelledBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCancelledBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelledBookings = action.payload;
      })
      .addCase(fetchCancelledBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Complete/Update
      .addCase(setBookingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setBookingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingBookings = state.pendingBookings.filter(b => b._id !== action.payload.id);
      })
      .addCase(setBookingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Today Shift Context
      .addCase(fetchTodayShiftContext.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayShiftContext.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeShift = action.payload; 
      })
      .addCase(fetchTodayShiftContext.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Start Daily Shift
      .addCase(startDailyShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startDailyShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeShift = action.payload; // Updates to ongoing
      })
      .addCase(startDailyShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // End Daily Shift
      .addCase(endDailyShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endDailyShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeShift = null; // Cleared because it is completed
      })
      .addCase(endDailyShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingError } = bookingSlice.actions;

export const selectPendingBookings = (state) => state.booking.pendingBookings;
export const selectConfirmedBookings = (state) => state.booking.confirmedBookings;
export const selectOngoingBookings = (state) => state.booking.ongoingBookings;
export const selectOnrunningBookings = (state) => state.booking.onrunningBookings;
export const selectCompletedBookings = (state) => state.booking.completedBookings;
export const selectCancelledBookings = (state) => state.booking.cancelledBookings;
export const selectBookingLoading = (state) => state.booking.isLoading;
export const selectBookingError = (state) => state.booking.error;
export const selectActiveShift = (state) => state.booking.activeShift;

export default bookingSlice.reducer;
