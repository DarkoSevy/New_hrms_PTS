import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Helper: promisify db.get
const dbGet = (sql: string, params: any[]): Promise<any> =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

// Helper: promisify db.run
const dbRun = (sql: string, params: any[]): Promise<void> =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve();
        });
    });

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const usernameOrEmail = email;

        if (!usernameOrEmail || !password) {
            res.status(400).json({ error: 'Username/Email and password are required' });
            return;
        }

        // Check both username and email fields
        const user = await dbGet(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [usernameOrEmail, usernameOrEmail]
        );

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Compare password with hashed password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Date.now().toString();
        const createdAt = new Date().toISOString();

        await dbRun(
            'INSERT INTO users (id, username, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, username, email, hashedPassword, role || 'Employee', 'Active', createdAt]
        );

        const token = jwt.sign(
            { userId: id, email, role: role || 'Employee' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            token,
            user: { id, username, email, role: role || 'Employee' },
        });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
            res.status(409).json({ error: 'Email already exists' });
        } else {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
});

// Verify token
router.get('/verify', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, JWT_SECRET, (err, payload) => {
                if (err) reject(err);
                else resolve(payload);
            });
        });

        res.json({ valid: true, user: decoded });
    } catch {
        res.status(403).json({ error: 'Invalid token' });
    }
});

export default router;
