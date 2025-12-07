import type { Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import prisma from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class VendorController {

    public validateVendorSignup = [
        body('name').trim().isLength({ min: 2 }).withMessage('Vendor name must be at least 2 characters'),
        body('contactEmail').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must include uppercase, lowercase, number and special character'),
        body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
        body('notes').optional().trim(),
        body('vendorMeta').optional().isObject().withMessage('vendorMeta must be a valid JSON object')
    ];

    public validateVendorLogin = [
        body('contactEmail').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required')
    ];

    public validateVendor = [
        body('name').trim().isLength({ min: 2 }).withMessage('Vendor name must be at least 2 characters'),
        body('contactEmail').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
        body('notes').optional().trim(),
        body('vendorMeta').optional().isObject().withMessage('vendorMeta must be a valid JSON object')
    ];

    // Vendor Signup
    public async signup(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
            return;
        }

        const { name, contactEmail, password, phone, notes, vendorMeta } = req.body;

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

            const hashedPassword = await bcrypt.hash(password, 10);

            const newVendor = await prisma.vendor.create({
                data: {
                    name,
                    contactEmail,
                    password: hashedPassword,
                    phone: phone || null,
                    notes: notes || null,
                    vendorMeta: vendorMeta || null
                },
                select: {
                    id: true,
                    name: true,
                    contactEmail: true,
                    phone: true,
                    notes: true,
                    vendorMeta: true,
                    createdAt: true
                }
            });

            const token = jwt.sign(
                { vendorId: newVendor.id, type: 'vendor' },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );

            res.status(201).json({ 
                success: true,
                message: 'Vendor registered successfully',
                data: {
                    vendor: newVendor,
                    token
                }
            });
        } catch (error) {
            console.error('Vendor signup error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    // Vendor Login
    public async login(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
            return;
        }

        const { contactEmail, password } = req.body;

        try {
            const vendor = await prisma.vendor.findFirst({
                where: { contactEmail }
            });

            if (!vendor) {
                res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, vendor.password);

            if (!isPasswordValid) {
                res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
                return;
            }

            const token = jwt.sign(
                { vendorId: vendor.id, type: 'vendor' },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );

            const { password: _, ...vendorWithoutPassword } = vendor;

            res.status(200).json({ 
                success: true,
                message: 'Login successful',
                data: {
                    vendor: vendorWithoutPassword,
                    token
                }
            });
        } catch (error) {
            console.error('Vendor login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    public async createVendor(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
            return;
        }

        const { name, contactEmail, phone, notes, vendorMeta, password } = req.body;

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

            const hashedPassword = await bcrypt.hash(password, 10);

            const newVendor = await prisma.vendor.create({
                data: {
                    name,
                    contactEmail,
                    password: hashedPassword,
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
                            id: true,
                            status: true,
                            sentAt: true,
                            rfp: {
                                select: {
                                    title: true
                                }
                            }
                        },
                        orderBy: {
                            sentAt: 'desc'
                        },
                        take: 3
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
                            : '0%',
                        recentRfps: vendor.sentRfps
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

    // Get vendor RFPs with pagination
    public async getVendorRFPs(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const vendor = await prisma.vendor.findUnique({
                where: { id }
            });

            if (!vendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            const [rfps, total] = await Promise.all([
                prisma.sentRFP.findMany({
                    where: { vendorId: id },
                    include: {
                        rfp: {
                            select: {
                                id: true,
                                title: true,
                                budgetUsd: true,
                                deliveryDays: true,
                                requirements: true,
                                createdBy: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { sentAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.sentRFP.count({
                    where: { vendorId: id }
                })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    rfps,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get vendor RFPs error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    // Get single sent RFP by ID
    public async getSentRFPById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Sent RFP ID is required' 
                });
                return;
            }

            const sentRfp = await prisma.sentRFP.findUnique({
                where: { id },
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
                            createdAt: true,
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    vendor: {
                        select: {
                            id: true,
                            name: true,
                            contactEmail: true
                        }
                    }
                }
            });

            if (!sentRfp) {
                res.status(404).json({ 
                    success: false,
                    message: 'Sent RFP not found' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { sentRfp }
            });
        } catch (error) {
            console.error('Get sent RFP error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }

    // Get vendor proposals with pagination
    public async getVendorProposals(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            if (!id) {
                res.status(400).json({ 
                    success: false,
                    message: 'Vendor ID is required' 
                });
                return;
            }

            const vendor = await prisma.vendor.findUnique({
                where: { id }
            });

            if (!vendor) {
                res.status(404).json({ 
                    success: false,
                    message: 'Vendor not found' 
                });
                return;
            }

            const [proposals, total] = await Promise.all([
                prisma.proposal.findMany({
                    where: { vendorId: id },
                    include: {
                        rfp: {
                            select: {
                                title: true,
                                createdBy: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.proposal.count({
                    where: { vendorId: id }
                })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    proposals,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get vendor proposals error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }
}

export default new VendorController();
