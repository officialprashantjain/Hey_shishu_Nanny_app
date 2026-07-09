import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,    // Full NannyProfile object from API
  isLoading: false,
  isSaving: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action) => {
      state.isLoading = false;
      state.profile = action.payload; // response.data.profile
    },
    fetchProfileFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateProfileStart: (state) => {
      state.isSaving = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action) => {
      state.isSaving = false;
      state.profile = { ...state.profile, ...action.payload };
    },
    updateProfileFailure: (state, action) => {
      state.isSaving = false;
      state.error = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.isSaving = false;
      state.error = null;
    },
  },
});

export const {
  fetchProfileStart, fetchProfileSuccess, fetchProfileFailure,
  updateProfileStart, updateProfileSuccess, updateProfileFailure,
  clearProfile,
} = profileSlice.actions;

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectProfileLoading = (state) => state.profile.isLoading;
export const selectProfileSaving = (state) => state.profile.isSaving;
export const selectProfileError = (state) => state.profile.error;

export default profileSlice.reducer;
