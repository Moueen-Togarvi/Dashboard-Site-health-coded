const mongoose = require('mongoose');
const { getTenantConnection } = require('../services/tenantService');

/**
 * Middleware to establish tenant database context
 * This middleware should be used AFTER authentication middleware
 * It extracts the tenant database name from the authenticated user
 * and attaches tenant-specific models to the request object
 */
const attachTenantModels = async (req, res, next) => {
    try {
        // Ensure user is authenticated (should be set by authenticate middleware)
        if (!req.user || !req.user.tenantDbName) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to access tenant resources',
            });
        }

        const tenantDbName = req.user.tenantDbName;

        // Get connection to tenant database
        const tenantConnection = getTenantConnection(tenantDbName);

        // Define schemas for tenant collections
        const patientSchema = new mongoose.Schema({
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: String,
            phone: String,
            dateOfBirth: Date,
            address: String,
            medicalHistory: String,
            isActive: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        const appointmentSchema = new mongoose.Schema({
            patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
            appointmentDate: { type: Date, required: true },
            appointmentType: String,
            duration: Number, // in minutes
            status: {
                type: String,
                enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
                default: 'scheduled',
            },
            notes: String,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        const staffSchema = new mongoose.Schema({
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            role: {
                type: String,
                enum: ['admin', 'doctor', 'therapist', 'nurse', 'receptionist'],
                default: 'staff',
            },
            phone: String,
            isActive: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        const settingsSchema = new mongoose.Schema({
            clinicName: { type: String, required: true },
            clinicAddress: String,
            clinicPhone: String,
            clinicEmail: String,
            businessHours: {
                monday: { open: String, close: String },
                tuesday: { open: String, close: String },
                wednesday: { open: String, close: String },
                thursday: { open: String, close: String },
                friday: { open: String, close: String },
                saturday: { open: String, close: String },
                sunday: { open: String, close: String },
            },
            timezone: { type: String, default: 'UTC' },
            updatedAt: { type: Date, default: Date.now },
        });

        // Create models using the tenant connection
        req.tenantModels = {
            Patient: tenantConnection.model('Patient', patientSchema),
            Appointment: tenantConnection.model('Appointment', appointmentSchema),
            Staff: tenantConnection.model('Staff', staffSchema),
            Settings: tenantConnection.model('Settings', settingsSchema),
        };

        // Store connection for cleanup
        req.tenantConnection = tenantConnection;

        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to establish tenant database context',
            error: error.message,
        });
    }
};

module.exports = {
    attachTenantModels,
};
