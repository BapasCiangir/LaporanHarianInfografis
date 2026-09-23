const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE UTAMA
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// 2. ROUTE API (WAJIB DI ATAS STATIC FILES)
app.get('/api/report', async (req, res) => {
    try {
        let report = await prisma.report.findFirst();
        if (!report) {
            report = await prisma.report.create({ data: {} });
        }
        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Gagal mengambil data dari database' });
    }
});

app.put('/api/report', async (req, res) => {
    try {
        let report = await prisma.report.findFirst();
        const dataPayload = { ...req.body };
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

// 3. STATIC FILES (SEBAGAI PENUTUP)
app.use(express.static(path.join(__dirname, 'public')));

// 4. JALANKAN SERVER
app.listen(PORT, () => {
    console.log(`Server Bapas Ciangir berjalan di http://localhost:${PORT}`);
});
