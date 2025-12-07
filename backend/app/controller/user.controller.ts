import type { Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import prisma from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"


class UserController {

    public ValidateUser = [
       body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
       body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters long')
          .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
          .withMessage('Password must include uppercase, lowercase, number and special character'),
       body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
       body('name').trim().isLength({ min: 3 }).withMessage('name must be at least 3 characters'),
       body('avatar').trim().isURL().custom((value) => {
          if (!value.startsWith('https://')) {
             throw new Error('Avatar URL must start with https://');
          }
          return true;
       }).withMessage('Invalid avatar URL')
    ];

    public ValidateLogin = [
       body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
       body('password').notEmpty().withMessage('Password is required')
    ];

    public async signup (req : Request , res : Response) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ errors: errors.array() });
          return;
        }

        const {email , password , username , name , avatar} = req.body;

        try {
            const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                { email },
                { username }
                ]
            }
            });

            if (existingUser) {
            res.status(409).json({ 
                success: false,
                message: 'User with this email or username already exists' 
            });
            return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                name,
                avatar
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true
            }
            });

            res.status(201).json({ 
            success: true,
            message: 'User created successfully',
            data: {
                user: newUser,
            }
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
            });
        }
    }

    public async login (req : Request , res : Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ errors: errors.array() });
          return;
        }

        const {email , password} = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
                return;
            }

            const token = jwt.sign(
                { userId: user.id }, 
                process.env.JWT_SECRET as string, 
                { expiresIn: '7d' }
            );

            res.status(200).json({ 
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        name: user.name,
                        avatar: user.avatar
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }


}

export default new UserController();