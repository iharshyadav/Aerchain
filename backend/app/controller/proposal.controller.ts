import type { Request, Response } from "express";
import { query, validationResult } from 'express-validator';
import prisma from "../database/db.js";

class ProposalController {

    public validateGetProposals = [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('rfpId').optional().isUUID().withMessage('Invalid RFP ID format'),
    ];

    // Get all proposals for a specific user (across all their RFPs)
    public async getProposalsForUser(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const { userId } = req.params;
        const { page = '1', limit = '20', rfpId } = req.query;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
            return;
        }

        try {
            // Verify user exists
            const userExists = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!userExists) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            const limitNum = parseInt(limit as string);
            const pageNum = parseInt(page as string);
            const skip = (pageNum - 1) * limitNum;

            const whereClause: any = {
                rfp: {
                    createdById: userId
                }
            };

            if (rfpId) {
                whereClause.rfpId = rfpId as string;
            }

            const [proposals, totalCount] = await Promise.all([
                prisma.proposal.findMany({
                    where: whereClause,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rfpId: true,
                        vendorId: true,
                        priceUsd: true,
                        lineItems: true,
                        deliveryDays: true,
                        warrantyMonths: true,
                        paymentTerms: true,
                        completenessScore: true,
                        parsedAt: true,
                        rawEmailBody: true,
                        attachmentsMeta: true,
                        sentRfpReference: true,
                        createdAt: true,
                        rfp: {
                            select: {
                                id: true,
                                title: true,
                            }
                        },
                        vendor: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                            }
                        }
                    }
                }),
                prisma.proposal.count({ where: whereClause })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    proposals,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limitNum)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching proposals:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            });
        }
    }

    public async getProposalsByRFP(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const { rfpId } = req.params;
        const { page = '1', limit = '20' } = req.query;

        if (!rfpId) {
            res.status(400).json({
                success: false,
                message: 'RFP ID is required'
            });
            return;
        }

        try {
            // Verify RFP exists
            const rfpExists = await prisma.rFP.findUnique({
                where: { id: rfpId }
            });

            if (!rfpExists) {
                res.status(404).json({
                    success: false,
                    message: 'RFP not found'
                });
                return;
            }

            const limitNum = parseInt(limit as string);
            const pageNum = parseInt(page as string);
            const skip = (pageNum - 1) * limitNum;

            const [proposals, totalCount] = await Promise.all([
                prisma.proposal.findMany({
                    where: { rfpId },
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rfpId: true,
                        vendorId: true,
                        priceUsd: true,
                        lineItems: true,
                        deliveryDays: true,
                        warrantyMonths: true,
                        paymentTerms: true,
                        completenessScore: true,
                        parsedAt: true,
                        rawEmailBody: true,
                        attachmentsMeta: true,
                        sentRfpReference: true,
                        createdAt: true,
                        vendor: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                            }
                        }
                    }
                }),
                prisma.proposal.count({ where: { rfpId } })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    proposals,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limitNum)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching proposals by RFP:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            });
        }
    }

    // Get a single proposal by ID
    public async getProposalById(req: Request, res: Response) {
        const { proposalId } = req.params;

        if (!proposalId) {
            res.status(400).json({
                success: false,
                message: 'Proposal ID is required'
            });
            return;
        }

        try {
            const proposal = await prisma.proposal.findUnique({
                where: { id: proposalId },
                include: {
                    rfp: {
                        select: {
                            id: true,
                            title: true,
                            descriptionRaw: true,
                            requirements: true,
                            budgetUsd: true,
                            deliveryDays: true,
                            paymentTerms: true,
                            warrantyMonths: true,
                            referenceToken: true,
                            createdAt: true,
                        }
                    },
                    vendor: {
                        select: {
                            id: true,
                            name: true,
                            contactEmail: true,
                            phone: true,
                            notes: true,
                        }
                    },
                    attachments: true
                }
            });

            if (!proposal) {
                res.status(404).json({
                    success: false,
                    message: 'Proposal not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: proposal
            });

        } catch (error) {
            console.error('Error fetching proposal:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            });
        }
    }
}

export default new ProposalController();
