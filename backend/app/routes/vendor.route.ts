import { Router } from "express";
import vendorController from "../controller/vendor.controller.js";

const router = Router();

// Create a new vendor
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

export default router;
