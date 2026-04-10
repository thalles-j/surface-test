// Barrel file: re-exports all admin services from focused sub-modules
export { getDashboardStats, getRevenueData, getTopProducts } from './admin/dashboardService.js';
export { getSalesData, getSalesByPeriod, updateOrderStatus, bulkUpdateOrderStatus, updateOrderItems, updateOrderAddress, getOrderHistory, createInPersonSale, searchProductsForOrderEdit } from './admin/salesService.js';
export { getAnalyticsOverview, getConversionFunnel, getChannelData, hitVisit, getVisits, getCategorySales, getRecentOrders } from './admin/analyticsService.js';
export { getInventoryStatus, getLowStockProducts, updateProductInventory, createStockMovement, getStockMovements } from './admin/inventoryService.js';
export { getAllCustomers, getCustomerDetails, getCustomerClassification, getCustomerByEmail } from './admin/customerService.js';
export { getCollections, createCollection, updateCollection, deleteCollection, toggleCollectionLock, addProductsToCollection, removeProductFromCollection, bulkUpdateCollectionStatus } from './admin/collectionService.js';
export { getCategories, createCategory, updateCategory, deleteCategory, getCoupons, createCoupon, deleteCoupon, getCampaigns, createCampaign } from './admin/marketingService.js';
export { getStoreSettings, updateStoreSettings, toggleStoreStatus, getCustomizationSettings, updateCustomization, uploadBanner } from './admin/settingsService.js';
export { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getActivityLogs } from './admin/adminUserService.js';
export { subscribeEarlyAccess, checkEarlyAccess, getStoreLaunchInfo, listEarlyAccessEmails, grantEarlyAccess, revokeEarlyAccess } from './admin/earlyAccessService.js';

