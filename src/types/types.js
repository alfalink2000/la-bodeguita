// types/types.js - VERSIÓN OPTIMIZADA Y ORGANIZADA
export const types = {
  // ========== AUTH ==========
  authLogin: "[auth] Login",
  authLogout: "[auth] Logout",
  authCheckingFinish: "[auth] Finish checking login state",
  authStartLogin: "[auth] Start login",
  authStartRegister: "[auth] Start register",
  authStartTokenRenew: "[auth] Start token renew",
  authGetUsers: "[auth] Get users",
  authUpdateProfile: "[auth] Update profile",
  authStartLoading: "[auth] Start loading",
  authFinishLoading: "[auth] Finish loading",

  // ========== AUTH ADDRESS ==========
  authLoadUserAddresses: "[auth] Load user addresses",
  authUpdateUserAddress: "[auth] Update user address",
  authUpdateAddressInList: "[auth] Update address in list",
  authAddUserAddress: "[auth] Add user address",
  authRemoveUserAddress: "[auth] Remove user address",

  // ========== PRODUCTS ==========
  productsLoad: "[products] Load products",
  productStartLoading: "[products] Start loading",
  productFinishLoading: "[products] Finish loading",
  productAddNew: "[products] Add new product",
  productUpdated: "[products] Updated product",
  productDeleted: "[products] Deleted product",
  productSetActive: "[products] Set active product",

  // ========== FEATURED PRODUCTS ==========
  productSetPopular: "[products] Set popular products",
  productSetOnSale: "[products] Set on sale products",
  productTogglePopular: "[products] Toggle popular product",
  productToggleOnSale: "[products] Toggle on sale product",

  // ========== CATEGORIES ==========
  categoriesLoad: "[categories] Load categories",
  categoryAddNew: "[categories] Add new category",
  categoryUpdated: "[categories] Updated category",
  categoryDeleted: "[categories] Deleted category",

  // ========== APP CONFIG ==========
  appConfigLoad: "[appConfig] Load app config",
  appConfigUpdate: "[appConfig] Update app config",

  // ========== ADMIN USERS ==========
  adminUsersLoad: "[adminUsers] Load admin users",
  adminUserAddNew: "[adminUsers] Add new admin user",
  adminUserUpdated: "[adminUsers] Updated admin user",
  adminUserDeleted: "[adminUsers] Deleted admin user",
  adminUserSetActive: "[adminUsers] Set active user",
  adminUserClearActive: "[adminUsers] Clear active user",
  adminUserStatusToggled: "[adminUsers] Status toggled",

  // ========== CART ==========
  cartAddItem: "[cart] Add item",
  cartRemoveItem: "[cart] Remove item",
  cartUpdateQuantity: "[cart] Update quantity",
  cartClear: "[cart] Clear cart",
  cartToggleModal: "[cart] Toggle modal",
  cartReset: "[Cart] Reset",
  cartSetSelectedAddress: "[cart] Set selected address",

  // ========== ORDERS ==========
  ordersLoad: "[orders] Load orders",
  ordersStartLoading: "[orders] Start loading",
  ordersFinishLoading: "[orders] Finish loading",
  orderAddNew: "[orders] Add new order",
  orderUpdated: "[orders] Updated order",
  orderStatusChanged: "[orders] Status changed",
  orderSetActive: "[orders] Set active order",
  orderClearActive: "[orders] Clear active order",

  // ========== ORDER CONFIG ==========
  orderConfigLoad: "[orderConfig] Load config",
  orderConfigUpdate: "[orderConfig] Update config",

  // ========== STORES ==========
  storesLoad: "[stores] Load stores",
  storesStartLoading: "[stores] Start loading",
  storesFinishLoading: "[stores] Finish loading",
  storeAddNew: "[stores] Add new store",
  storeUpdated: "[stores] Updated store",
  storeDeleted: "[stores] Deleted store",
  storeSetActive: "[stores] Set active store",

  // ========== CHAT ==========
  chatSetLoading: "[chat] Set loading",
  chatLoadChats: "[chat] Load chats",
  chatLoadMessages: "[chat] Load messages",
  chatSelectChat: "[chat] Select chat",
  chatClearSelected: "[chat] Clear selected chat",
  chatAddMessage: "[chat] Add message",
  chatUpdateUnreadCount: "[chat] Update unread count",
  chatReset: "[chat] Reset",
};
