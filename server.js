const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware batas ukuran payload (15MB untuk foto base64)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 1. GET API: Mengambil data laporan harian
app.get('/api/report', async (req, res) => {
    try {
        let report = await prisma.report.findFirst();
        
        // Jika belum ada data di DB, cipta data awal
        if (!report) {
            report = await prisma.report.create({ data: {} });
        }
        
        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Gagal mengambil data dari database' });
    }
});

// 2. PUT API: Menyimpan atau memperbarui data laporan harian
app.put('/api/report', async (req, res) => {
    try {
        let report = await prisma.report.findFirst();
        const dataPayload = { ...req.body };

        // Hapus field id dan updatedAt agar tidak bentrok saat update
        delete dataPayload.id;
        delete dataPayload.updatedAt;

        if (report) {
            report = await prisma.report.update({
                where: { id: report.id },
                data: dataPayload,
            });
        } else {
            report = await prisma.report.create({
                data: dataPayload,
            });
        }

        res.json({ success: true, message: 'Data berhasil disimpan', data: report });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Gagal menyimpan data ke database' });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server Bapas Ciangir berjalan di http://localhost:${PORT}`);
});
