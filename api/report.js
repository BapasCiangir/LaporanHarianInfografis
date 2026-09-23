import { PrismaClient } from '@prisma/client';

// Reuse Prisma Client instance di serverless environment
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req, res) {
    // Set Header CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. GET: Ambil Data
    if (req.method === 'GET') {
        try {
            let report = await prisma.report.findFirst();
            if (!report) {
                report = await prisma.report.create({ data: {} });
            }
            return res.status(200).json(report);
        } catch (error) {
            console.error('Error GET /api/report:', error);
            return res.status(500).json({ error: 'Gagal mengambil data dari database' });
        }
    }

    // 2. PUT: Simpan / Kemas Kini Data
    if (req.method === 'PUT') {
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

            return res.status(200).json({ success: true, data: report });
        } catch (error) {
            console.error('Error PUT /api/report:', error);
            return res.status(500).json({ error: 'Gagal menyimpan data ke database' });
        }
    }

    return res.status(450).json({ error: 'Method not allowed' });
}
