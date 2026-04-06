import express from 'express';
import adminController from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== DASHBOARD =====
// Tornamos as rotas do dashboard públicas durante o desenvolvimento para permitir
// que o frontend carregue métricas sem autenticação. Proteja-as em produção.
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/revenue', adminController.getRevenueData);
router.get('/dashboard/top-products', adminController.getTopProducts);

// Endpoint público para registrar um hit de acesso (útil para contagem de visitas)
router.post('/analytics/visits/hit', adminController.hitVisit);

// ===== EARLY ACCESS (public) =====
router.post('/early-access/subscribe', adminController.subscribeEarlyAccess);
router.get('/early-access/check', adminController.checkEarlyAccess);
router.get('/early-access/launch-info', adminController.getStoreLaunchInfo);

// Todas as rotas abaixo requerem autenticação
router.use(authMiddleware);

// ===== SALES / ORDERS =====
router.get('/sales', adminController.getSalesData);
router.get('/sales/by-period', adminController.getSalesByPeriod);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/bulk-status', adminController.bulkUpdateOrderStatus);
router.put('/orders/:id/items', adminController.updateOrderItems);
router.patch('/orders/:id/address', adminController.updateOrderAddress);

// ===== IN-PERSON SALES =====
router.post('/sales/in-person', adminController.createInPersonSale);

// ===== EARLY ACCESS (admin) =====
router.get('/early-access/emails', adminController.listEarlyAccessEmails);
router.post('/early-access/grant', adminController.grantEarlyAccess);
router.post('/early-access/revoke', adminController.revokeEarlyAccess);

// ===== ANALYTICS =====
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/conversion-funnel', adminController.getConversionFunnel);
router.get('/analytics/channels', adminController.getChannelData);
router.get('/analytics/category-sales', adminController.getCategorySales);
router.get('/analytics/recent-orders', adminController.getRecentOrders);

// ===== INVENTORY =====
router.get('/inventory/status', adminController.getInventoryStatus);
router.get('/inventory/low-stock', adminController.getLowStockProducts);
router.get('/inventory/movements', adminController.getStockMovements);
router.post('/inventory/movements', adminController.createStockMovement);
router.patch('/inventory/:productId', adminController.updateProductInventory);

// ===== CUSTOMERS =====
router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerDetails);
router.get('/customers/analytics/classification', adminController.getCustomerClassification);

// ===== COLLECTIONS =====
router.get('/collections', adminController.getCollections);
router.post('/collections', adminController.createCollection);
router.patch('/collections/:id', adminController.updateCollection);
router.delete('/collections/:id', adminController.deleteCollection);
router.patch('/collections/:id/lock', adminController.toggleCollectionLock);
router.patch('/collections/bulk-status', adminController.bulkUpdateCollectionStatus);
// add/remove products in a collection
router.post('/collections/:id/products', adminController.addProductsToCollection);
router.delete('/collections/:id/products/:productId', adminController.removeProductFromCollection);

// ===== CATEGORIES =====
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ===== MARKETING =====
router.get('/marketing/coupons', adminController.getCoupons);
router.post('/marketing/coupons', adminController.createCoupon);
router.delete('/marketing/coupons/:id', adminController.deleteCoupon);
router.get('/marketing/campaigns', adminController.getCampaigns);
router.post('/marketing/campaigns', adminController.createCampaign);

// ===== STORE SETTINGS =====
router.get('/settings', adminController.getStoreSettings);
router.patch('/settings', adminController.updateStoreSettings);
router.patch('/settings/toggle-store', adminController.toggleStoreStatus);

// ===== CUSTOMIZATION =====
router.get('/customization', adminController.getCustomizationSettings);
router.patch('/customization', adminController.updateCustomization);
router.post('/customization/upload-banner', adminController.uploadBanner);

// ===== VISITS (protected - list) =====
router.get('/analytics/visits', adminController.getVisits);

// ===== ADMIN MANAGEMENT =====
router.get('/admins', adminController.getAdminUsers);
router.post('/admins', adminController.createAdminUser);
router.patch('/admins/:id', adminController.updateAdminUser);
router.delete('/admins/:id', adminController.deleteAdminUser);
router.get('/admins/logs', adminController.getActivityLogs);

export default router;
