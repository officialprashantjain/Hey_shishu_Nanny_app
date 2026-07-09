import api from './api';
import { saveToken, removeToken, getToken } from '../utils/storage';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../redux/slices/authSlice';
import { fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, clearProfile } from '../redux/slices/profileSlice';
import { getMyProfile } from './nannyService';

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
// Returns { success, isProfileComplete } on success, or { success: false, message } on fail
export const loginNanny = (email, password) => async (dispatch) => {
  try {
    dispatch(loginStart());

    const response = await api.post('/auth/nanny/login', { email, password });
    // response = { status: 'success', token: '...', data: { _id, fullName, email, role } }

    await saveToken(response.token);
    dispatch(loginSuccess({ token: response.token, data: response.data }));

    // ── After login: fetch full nanny profile ──────────────────────────────────
    dispatch(fetchProfileStart());
    try {
      const profileResponse = await getMyProfile();
      dispatch(fetchProfileSuccess(profileResponse.data.profile));
      const isProfileComplete = profileResponse.data.profile?.isProfileComplete ?? false;
      return { success: true, isProfileComplete };
    } catch (profileError) {
      dispatch(fetchProfileFailure('Could not load profile'));
      return { success: true, isProfileComplete: true }; // login succeeded even if profile fails
    }

  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Login failed. Please try again.';
    dispatch(loginFailure(message));
    return { success: false, message };
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logoutNanny = () => async (dispatch) => {
  await removeToken();
  dispatch(logoutAction());
  dispatch(clearProfile());
};
