// reducers/authReducer.js
import { types } from "../types/types";

const initialState = {
  checking: true,
  loading: false,
  uid: null,
  name: null,
  role: null,
  full_name: null,
  email: null,
  address: null,
  city: null,
  lat: null,
  lng: null,
  phone: null,
  isLoggedIn: false,
};

export const authReducer = (state = initialState, action) => {
  if (!action || !action.type) {
    return state;
  }

  switch (action.type) {
    case types.authStartLogin:
    case types.authStartLoading:
      return {
        ...state,
        loading: true,
      };

    case types.authLogin:
      return {
        ...state,
        checking: false,
        loading: false,
        uid: action.payload.uid,
        name: action.payload.name,
        role: action.payload.role,
        full_name: action.payload.full_name,
        email: action.payload.email,
        address: action.payload.address,
        city: action.payload.city,
        lat: action.payload.lat,
        lng: action.payload.lng,
        phone: action.payload.phone,
        isLoggedIn: true,
      };

    // ✅ NUEVO: Actualizar perfil
    case types.authUpdateProfile:
      return {
        ...state,
        full_name: action.payload.full_name || state.full_name,
        phone: action.payload.phone || state.phone,
        address: action.payload.address || state.address,
        lat: action.payload.lat || state.lat,
        lng: action.payload.lng || state.lng,
        email: action.payload.email || state.email,
      };

    case types.authCheckingFinish:
    case types.authFinishLoading:
      return {
        ...state,
        checking: false,
        loading: false,
      };

    case types.authLogout:
      return {
        ...initialState,
        checking: false,
        loading: false,
      };

    default:
      return state;
  }
};
