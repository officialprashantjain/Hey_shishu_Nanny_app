import { subscribeSession } from '../utils/storage';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import bookingReducer from './slices/bookingSlice';

const appReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  booking: bookingReducer,
});

const rootReducer = (state, action) => appReducer(action.type === 'auth/logout' ? undefined : state, action);

const store = configureStore({
  reducer: rootReducer,
});

subscribeSession((session) => store.dispatch({ type: session ? 'auth/sessionRestored' : 'auth/logout', payload: session }));
export default store;
