const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
} = require('../controllers/staffController');
const { authenticate } = require('../middleware/authMiddleware');
const { attachTenantModels } = require('../middleware/tenantMiddleware');

// All routes require authentication and tenant context
router.use(authenticate);
router.use(attachTenantModels);

// Staff routes
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
