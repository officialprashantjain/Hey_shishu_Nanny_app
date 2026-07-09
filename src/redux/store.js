import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import bookingReducer from './slices/bookingSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  booking: bookingReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
