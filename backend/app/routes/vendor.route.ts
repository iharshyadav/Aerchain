import { Router } from "express";
import vendorController from "../controller/vendor.controller.js";

const router = Router();

// Vendor Authentication
router.post("/signup", vendorController.validateVendorSignup, vendorController.signup);
router.post("/login", vendorController.validateVendorLogin, vendorController.login);

// Create a new vendor (admin only - without auth)
router.post("/", vendorController.validateVendor, vendorController.createVendor);

// Get all vendors (with pagination and search)
router.get("/", vendorController.getAllVendors);

// Get a single vendor by ID
router.get("/:id", vendorController.getVendorById);

// Update a vendor
router.put("/:id", vendorController.validateVendor, vendorController.updateVendor);

// Delete a vendor
router.delete("/:id", vendorController.deleteVendor);

// Get vendor statistics
router.get("/:id/stats", vendorController.getVendorStats);

// Get vendor RFPs
router.get("/:id/rfps", vendorController.getVendorRFPs);

// Get single sent RFP by ID
router.get("/rfp/:id", vendorController.getSentRFPById);

// Get vendor proposals
router.get("/:id/proposals", vendorController.getVendorProposals);

export default router;
