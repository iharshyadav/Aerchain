import type { Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import prisma from "../database/db.js";

class VendorController {

    public validateVendor = [
        body('name').trim().isLength({ min: 2 }).withMessage('Vendor name must be at least 2 characters'),
        body('contactEmail').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
        body('notes').optional().trim(),
        body('vendorMeta').optional().isObject().withMessage('vendorMeta must be a valid JSON object')
    ];

    public async createVendor(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
            return;
        }

        const { name, contactEmail, phone, notes, vendorMeta } = req.body;

        try {
            const existingVendor = await prisma.vendor.findFirst({
                where: { contactEmail }
            });

            if (existingVendor) {
                res.status(409).json({ 
                    success: false,
                    message: 'Vendor with this email already exists' 
                });
                return;
            }

            const newVendor = await prisma.vendor.create({
                data: {
                    name,
                    contactEmail,
                    phone: phone || null,
                    notes: notes || null,
                    vendorMeta: vendorMeta || null
                }
            });

            res.status(201).json({ 
                success: true,
                message: 'Vendor created successfully',
                data: newVendor
            });
        } catch (error) {
            console.error('Create vendor error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async getAllVendors(req: Request, res: Response) {
        try {
            const { page = '1', limit = '10', search = '' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const whereClause = search ? {
                OR: [
                    { name: { contains: search as string, mode: 'insensitive' as const } },
                    { contactEmail: { contains: search as string, mode: 'insensitive' as const } }
                ]
            } : {};

            const [vendors, totalCount] = await Promise.all([
                prisma.vendor.findMany({
                    where: whereClause,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: {
                                sentRfps: true,
                                proposals: true
                            }
                        }
                    }
                }),
                prisma.vendor.count({ where: whereClause })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    vendors,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limitNum)
                    }
                }
            });
        } catch (error) {
            console.error('Get vendors error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async getVendorById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const vendor = await prisma.vendor.findUnique({
                where: { id },
                include: {
                    sentRfps: {
                        include: {
                            rfp: {
                                select: {
                                    id: true,
                                    title: true,
                                    createdAt: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    },
                    proposals: {
                        include: {
                            rfp: {
                                select: {
                                    id: true,
                                    title: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    },
                    _count: {
                        select: {
                            sentRfps: true,
                            proposals: true
                        }
                    }
                }
            });

            if (!vendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: vendor
            });
        } catch (error) {
            console.error('Get vendor by ID error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async updateVendor(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
            return;
        }

        try {
            const { id } = req.params;
            const { name, contactEmail, phone, notes, vendorMeta } = req.body;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const existingVendor = await prisma.vendor.findUnique({
                where: { id }
            });

            if (!existingVendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            if (contactEmail && contactEmail !== existingVendor.contactEmail) {
                const emailTaken = await prisma.vendor.findFirst({
                    where: { 
                        contactEmail,
                        id: { not: id }
                    }
                });

                if (emailTaken) {
                    res.status(409).json({ 
                        success: false,
                        message: 'Email is already associated with another vendor' 
                    });
                    return;
                }
            }

            const updatedVendor = await prisma.vendor.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(contactEmail && { contactEmail }),
                    ...(phone !== undefined && { phone }),
                    ...(notes !== undefined && { notes }),
                    ...(vendorMeta !== undefined && { vendorMeta })
                }
            });

            res.status(200).json({ 
                success: true,
                message: 'Vendor updated successfully',
                data: updatedVendor
            });
        } catch (error) {
            console.error('Update vendor error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async deleteVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const [existingVendor, sentRfpsCount, proposalsCount] = await Promise.all([
                prisma.vendor.findUnique({ where: { id } }),
                prisma.sentRFP.count({ where: { vendorId: id } }),
                prisma.proposal.count({ where: { vendorId: id } })
            ]);

            if (!existingVendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            if (sentRfpsCount > 0 || proposalsCount > 0) {
                res.status(400).json({ 
                    success: false,
                    message: 'Cannot delete vendor with existing RFPs or proposals',
                    data: {
                        sentRfps: sentRfpsCount,
                        proposals: proposalsCount
                    }
                });
                return;
            }

            await prisma.vendor.delete({
                where: { id }
            });

            res.status(200).json({ 
                success: true,
                message: 'Vendor deleted successfully'
            });
        } catch (error) {
            console.error('Delete vendor error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async getVendorStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const vendor = await prisma.vendor.findUnique({
                where: { id },
                include: {
                    sentRfps: {
                        select: {
                            status: true
                        }
                    },
                    proposals: {
                        select: {
                            priceUsd: true,
                            completenessScore: true
                        }
                    }
                }
            });

            if (!vendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            const totalRfpsSent = vendor.sentRfps.length;
            const rfpStatusCounts = vendor.sentRfps.reduce((acc: Record<string, number>, rfp: { status: string }) => {
                acc[rfp.status] = (acc[rfp.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const totalProposals = vendor.proposals.length;
            const avgProposalPrice = vendor.proposals.length > 0
                ? vendor.proposals.reduce((sum: number, p: { priceUsd: any }) => sum + (Number(p.priceUsd) || 0), 0) / vendor.proposals.length
                : 0;

            const avgCompletenessScore = vendor.proposals.length > 0
                ? vendor.proposals.reduce((sum: number, p: { completenessScore: number | null }) => sum + (p.completenessScore || 0), 0) / vendor.proposals.length
                : 0;

            res.status(200).json({
                success: true,
                data: {
                    vendorId: id,
                    vendorName: vendor.name,
                    stats: {
                        totalRfpsSent,
                        rfpStatusBreakdown: rfpStatusCounts,
                        totalProposals,
                        averageProposalPrice: avgProposalPrice.toFixed(2),
                        averageCompletenessScore: avgCompletenessScore.toFixed(2),
                        responseRate: totalRfpsSent > 0 
                            ? ((totalProposals / totalRfpsSent) * 100).toFixed(2) + '%'
                            : '0%'
                    }
                }
            });
        } catch (error) {
            console.error('Get vendor stats error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }
}

export default new VendorController();
