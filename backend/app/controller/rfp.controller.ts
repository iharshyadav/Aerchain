import type { Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import { generateResponse } from "./llm.controller.js";
import { rfpPrompt } from "../prompts/rfp.prompt.js";
import prisma from "../database/db.js";
import crypto from "crypto";

interface ParsedRFPItem {
    name: string;
    qty: number | null;
    specs: Record<string, any>;
    unit_budget_usd: number | null;
}

interface ParsedRFP {
    title: string | null;
    items: ParsedRFPItem[];
    total_budget_usd: number | null;
    delivery_days: number | null;
    payment_terms: string | null;
    warranty_months: number | null;
}

class UserRfpController {

    public validateRfpParser = [
        body('text')
            .trim()
            .notEmpty()
            .withMessage('RFP text is required')
            .isLength({ min: 10 })
            .withMessage('RFP text must be at least 10 characters long'),
        body('userId')
            .optional()
            .isUUID()
            .withMessage('Invalid user ID format')
    ];

    private cleanLLMResponse = (response: string): string => {
        let cleaned = response.trim();
        
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
        
        cleaned = cleaned.replace(/\n?```\s*$/i, '');
        
        return cleaned.trim();
    }

    public userRfpParser = async (req: Request, res: Response): Promise<void> => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ 
                    success: false, 
                    message: "Validation failed",
                    errors: errors.array() 
                });
                return;
            }

            const { text, userId } = req.body;

            if (userId) {
                const userExists = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true }
                });

                if (!userExists) {
                    res.status(404).json({ 
                        success: false, 
                        message: "User not found" 
                    });
                    return;
                }
            }

            const formattedPrompt = rfpPrompt.replace('{{input}}', text);
            const llmResponse = await generateResponse(text, formattedPrompt);

            const cleanedResponse = this.cleanLLMResponse(llmResponse);

            let parsedRfp: ParsedRFP;
            try {
                parsedRfp = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.error("Failed to parse LLM response:", llmResponse);
                console.error("Cleaned response:", cleanedResponse);
                res.status(500).json({ 
                    success: false, 
                    message: "Failed to parse RFP structure",
                    details: "LLM returned invalid JSON" 
                });
                return;
            }

            if (!parsedRfp.items || !Array.isArray(parsedRfp.items) || parsedRfp.items.length === 0) {
                res.status(400).json({ 
                    success: false, 
                    message: "Invalid RFP structure: at least one item is required" 
                });
                return;
            }

            const referenceToken = crypto.randomBytes(16).toString('hex');

            const requirements = {
                items: parsedRfp.items,
                metadata: {
                    parsedAt: new Date().toISOString(),
                    itemCount: parsedRfp.items.length
                }
            };

            const rfp = await prisma.rFP.create({
                data: {
                    title: parsedRfp.title || "Untitled RFP",
                    descriptionRaw: text,
                    requirements: requirements as any,
                    budgetUsd: parsedRfp.total_budget_usd,
                    deliveryDays: parsedRfp.delivery_days,
                    paymentTerms: parsedRfp.payment_terms,
                    warrantyMonths: parsedRfp.warranty_months,
                    referenceToken,
                    createdById: userId
                },
                select: {
                    id: true,
                    title: true,
                    requirements: true,
                    budgetUsd: true,
                    deliveryDays: true,
                    paymentTerms: true,
                    warrantyMonths: true,
                    referenceToken: true,
                    createdAt: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true
                        }
                    }
                }
            });

            res.status(201).json({ 
                success: true, 
                message: "RFP parsed and saved successfully",
                data: {
                    rfp,
                    parsedStructure: parsedRfp
                }
            });

        } catch (error) {
            console.error("Error in userRfpParser:", error);
            
            if (error instanceof Error) {
                if (error.message.includes('Foreign key constraint')) {
                    res.status(400).json({ 
                        success: false, 
                        message: "Invalid user ID provided" 
                    });
                    return;
                }
            }

            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                details: process.env.NODE_ENV === 'development' 
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            });
        }
    }
}

export default new UserRfpController();