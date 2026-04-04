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

// Todas as rotas abaixo requerem autenticação
router.use(authMiddleware);

// ===== SALES / ORDERS =====
router.get('/sales', adminController.getSalesData);
router.get('/sales/by-period', adminController.getSalesByPeriod);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// ===== ANALYTICS =====
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/conversion-funnel', adminController.getConversionFunnel);
router.get('/analytics/channels', adminController.getChannelData);

// ===== INVENTORY =====
router.get('/inventory/status', adminController.getInventoryStatus);
router.get('/inventory/low-stock', adminController.getLowStockProducts);
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

// ===== CUSTOMIZATION =====
router.get('/customization', adminController.getCustomizationSettings);
router.patch('/customization', adminController.updateCustomization);
router.post('/customization/upload-banner', adminController.uploadBanner);

// ===== ADMIN MANAGEMENT =====
router.get('/admins', adminController.getAdminUsers);
router.post('/admins', adminController.createAdminUser);
router.patch('/admins/:id', adminController.updateAdminUser);
router.delete('/admins/:id', adminController.deleteAdminUser);
router.get('/admins/logs', adminController.getActivityLogs);

export default router;
