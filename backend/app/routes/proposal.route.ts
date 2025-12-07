import { Router } from "express";
import proposalController from "../controller/proposal.controller.js";

const router = Router();

// Get all proposals for a user (across all their RFPs)
router.get("/user/:userId", proposalController.validateGetProposals, proposalController.getProposalsForUser);

// Get proposals for a specific RFP
router.get("/rfp/:rfpId", proposalController.validateGetProposals, proposalController.getProposalsByRFP);

// Get a single proposal by ID
router.get("/:proposalId", proposalController.getProposalById);

// Compare proposals for an RFP with AI ranking
router.get("/compare/:rfpId", proposalController.compareProposals);

export default router;
