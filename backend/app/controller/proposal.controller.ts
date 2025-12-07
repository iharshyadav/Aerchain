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

    // Compare proposals for an RFP using AI
    public async compareProposals(req: Request, res: Response) {
        const { rfpId } = req.params;

        if (!rfpId) {
            res.status(400).json({
                success: false,
                message: 'RFP ID is required'
            });
            return;
        }

        try {
            // Get RFP details
            const rfp = await prisma.rFP.findUnique({
                where: { id: rfpId },
                select: {
                    id: true,
                    title: true,
                    budgetUsd: true,
                    deliveryDays: true,
                    requirements: true
                }
            });

            if (!rfp) {
                res.status(404).json({
                    success: false,
                    message: 'RFP not found'
                });
                return;
            }

            // Get all proposals for this RFP
            const proposals = await prisma.proposal.findMany({
                where: { rfpId },
                include: {
                    vendor: {
                        select: {
                            id: true,
                            name: true,
                            contactEmail: true
                        }
                    }
                }
            });

            if (proposals.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'No proposals found for this RFP'
                });
                return;
            }

            // Rank proposals based on multiple criteria
            const rankedProposals = proposals.map(proposal => {
                let score = 0;
                let reasons: string[] = [];

                // Price scoring (30 points max) - lower price is better
                if (proposal.priceUsd && rfp.budgetUsd) {
                    const priceDiff = Number(rfp.budgetUsd) - Number(proposal.priceUsd);
                    if (priceDiff >= 0) {
                        const priceScore = Math.min(30, (priceDiff / Number(rfp.budgetUsd)) * 30);
                        score += priceScore;
                        if (priceDiff > 0) {
                            reasons.push(`Under budget by $${priceDiff.toLocaleString()}`);
                        }
                    } else {
                        reasons.push(`Over budget by $${Math.abs(priceDiff).toLocaleString()}`);
                    }
                }

                // Completeness scoring (30 points max)
                if (proposal.completenessScore) {
                    const completenessPoints = (proposal.completenessScore / 100) * 30;
                    score += completenessPoints;
                    if (proposal.completenessScore >= 90) {
                        reasons.push(`Excellent response completeness (${Math.round(proposal.completenessScore)}%)`);
                    } else if (proposal.completenessScore >= 70) {
                        reasons.push(`Good response completeness (${Math.round(proposal.completenessScore)}%)`);
                    } else {
                        reasons.push(`Incomplete response (${Math.round(proposal.completenessScore)}%)`);
                    }
                }

                // Delivery time scoring (20 points max) - faster is better
                if (proposal.deliveryDays && rfp.deliveryDays) {
                    const deliveryDiff = rfp.deliveryDays - proposal.deliveryDays;
                    if (deliveryDiff >= 0) {
                        const deliveryScore = Math.min(20, (deliveryDiff / rfp.deliveryDays) * 20);
                        score += deliveryScore;
                        if (deliveryDiff > 0) {
                            reasons.push(`${deliveryDiff} days faster than requested`);
                        }
                    } else {
                        reasons.push(`${Math.abs(deliveryDiff)} days slower than requested`);
                    }
                }

                // Warranty scoring (10 points max)
                if (proposal.warrantyMonths) {
                    const warrantyScore = Math.min(10, (proposal.warrantyMonths / 24) * 10);
                    score += warrantyScore;
                    if (proposal.warrantyMonths >= 24) {
                        reasons.push(`Excellent warranty coverage (${proposal.warrantyMonths} months)`);
                    }
                }

                // Payment terms scoring (10 points max)
                if (proposal.paymentTerms) {
                    score += 10;
                    reasons.push('Clear payment terms provided');
                }

                return {
                    ...proposal,
                    rankingScore: Math.round(score),
                    rankingReasons: reasons,
                    priceUsd: proposal.priceUsd ? Number(proposal.priceUsd) : null
                };
            });

            // Sort by score descending
            rankedProposals.sort((a, b) => b.rankingScore - a.rankingScore);

            // Add rank position
            const finalRanked = rankedProposals.map((proposal, index) => ({
                ...proposal,
                rank: index + 1,
                recommendation: index === 0 ? 'BEST_CHOICE' : index === rankedProposals.length - 1 ? 'LEAST_SUITABLE' : 'CONSIDER'
            }));

            // Generate overall summary
            const bestProposal = finalRanked[0];
            const proposalsWithPrice = proposals.filter(p => p.priceUsd);
            const avgPrice = proposalsWithPrice.length > 0 
                ? proposalsWithPrice.reduce((sum, p) => sum + Number(p.priceUsd), 0) / proposalsWithPrice.length 
                : 0;

            const summary = {
                totalProposals: finalRanked.length,
                bestVendor: bestProposal?.vendor?.name || 'Unknown',
                bestScore: bestProposal?.rankingScore || 0,
                averagePrice: avgPrice,
                recommendation: bestProposal 
                    ? `${bestProposal.vendor.name} offers the best overall value with a score of ${bestProposal.rankingScore}/100. ${bestProposal.rankingReasons.join('. ')}.`
                    : 'No proposals available for comparison.'
            };

            res.status(200).json({
                success: true,
                data: {
                    rfp: {
                        id: rfp.id,
                        title: rfp.title,
                        budgetUsd: rfp.budgetUsd ? Number(rfp.budgetUsd) : null
                    },
                    rankedProposals: finalRanked,
                    summary
                }
            });

        } catch (error) {
            console.error('Error comparing proposals:', error);
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
