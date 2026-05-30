// reducers/authReducer.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";

const initialState = {
  checking: true,
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
  userAddresses: [],
  isLoggedIn: false,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.authLogin:
      return {
        ...state,
        ...action.payload,
        checking: false,
        isLoggedIn: true,
      };

    case types.authLogout:
      return {
        ...initialState,
        checking: false,
        isLoggedIn: false,
      };

    case types.authCheckingFinish:
      return {
        ...state,
        checking: false,
      };

    case types.authStartLoading:
      return {
        ...state,
        checking: true,
      };

    case types.authFinishLoading:
      return {
        ...state,
        checking: false,
      };

    case types.authUpdateUserAddress:
      return {
        ...state,
        address: action.payload.address,
        lat: action.payload.lat,
        lng: action.payload.lng,
      };

    case types.authLoadUserAddresses:
      return {
        ...state,
        userAddresses: action.payload,
      };

    case types.authUpdateAddressInList:
      return {
        ...state,
        userAddresses: state.userAddresses.map((addr) =>
          addr.id === action.payload.id ? { ...addr, ...action.payload } : addr,
        ),
      };

    case types.authAddUserAddress:
      return {
        ...state,
        userAddresses: [...state.userAddresses, action.payload],
      };

    case types.authRemoveUserAddress:
      return {
        ...state,
        userAddresses: state.userAddresses.filter(
          (addr) => addr.id !== action.payload,
        ),
      };

    case types.authUpdateProfile:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};
