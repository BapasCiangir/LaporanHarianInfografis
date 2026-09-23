// src/server.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bapas-secret-key-123';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit besar untuk foto Base64

// Middleware Autentikasi Admin
const authenticateAdmin = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};

// 1. Auth Route: Login Admin
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Sebagai fallback jika belum ada user di DB
    if (username === 'admin' && password === 'bapas123') {
      const token = jwt.sign({ username: 'admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, message: 'Login berhasil' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, message: 'Login berhasil' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 2. Public Route: Get Latest Report Data
app.get('/api/report', async (_req: Request, res: Response) => {
  try {
    let report = await prisma.reportData.findUnique({ where: { id: 'main' } });
    
    // Inisialisasi data default jika belum tersedia di Database
    if (!report) {
      report = await prisma.reportData.create({
        data: { id: 'main' }
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
});

// 3. Admin Protected Route: Update Report Data
app.put('/api/report', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const updatedData = req.body;
    
    // Mencegah perubahan ID utama
    delete updatedData.id;

    const report = await prisma.reportData.upsert({
      where: { id: 'main' },
      update: updatedData,
      create: { id: 'main', ...updatedData },
    });

    res.json({ message: 'Data berhasil diperbarui', report });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui data laporan' });
  }
});

// 4. Admin Protected Route: Reset Report Data
app.post('/api/report/reset', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    await prisma.reportData.deleteMany({ where: { id: 'main' } });
    const newReport = await prisma.reportData.create({ data: { id: 'main' } });
    res.json({ message: 'Data berhasil di-reset ke nilai default', report: newReport });
  } catch (error) {
    res.status(500).json({ error: 'Gagal meng-reset data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server API berjalan di port http://localhost:$3000`));
