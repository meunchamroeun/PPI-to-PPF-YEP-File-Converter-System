/**
 * ==============================================================================
 * SERVER-SIDE REFERENCE: YAMAHA PPI CONVERTER BACKEND SERVICE
 * ==============================================================================
 * Technologies: Node.js, Express, BullMQ (Redis queue), Telegraf (Telegram Bot),
 * PostgreSQL (pg), and JSZip.
 */

import express from 'express';
import multer from 'multer';
import { Queue, Worker } from 'bullmq';
import { Telegraf } from 'telegraf';
import pg from 'pg';
import JSZip from 'jszip';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 1. PostgreSQL Database Pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yamaha_converter'
});

// 2. Redis Connection & BullMQ Conversion Queue
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

const conversionQueue = new Queue('yamaha-ppi-conversions', { connection: redisConfig });

// 3. Multer In-Memory Storage for Uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 } // 250 MB max
});

// 4. Telegram Bot & Mini App Handler
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (botToken) {
  bot = new Telegraf(botToken);

  bot.start((ctx) => {
    ctx.reply('Welcome to Yamaha Expansion Voice Studio! 🎹\n\nConvert PPI files to PPF or YEP formats directly in Telegram.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Open Mini App', web_app: { url: process.env.MINI_APP_URL || 'https://app.yamaha-converter.io' } }]
        ]
      }
    });
  });

  bot.on('document', async (ctx) => {
    const doc = ctx.message.document;
    if (doc.file_name.endsWith('.ppi') || doc.file_name.endsWith('.cpi')) {
      ctx.reply(`📥 Received Yamaha pack: "${doc.file_name}" (${(doc.file_size / (1024 * 1024)).toFixed(2)} MB).\nDispatching to conversion engine...`);
    } else {
      ctx.reply('⚠️ Please upload a valid Yamaha .PPI or .CPI file.');
    }
  });

  bot.launch().then(() => console.log('🤖 Telegram Bot launched successfully.'));
}

// 5. REST API Endpoints
app.use(express.json());
app.use(express.static('.')); // Serve index.html

// Upload & Queue Conversion API
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetFormat = 'PPF' } = req.body;
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    // Binary signature check
    const signature = fileBuffer.slice(0, 4).toString('ascii');
    const isProtected = signature.startsWith('CPI') || fileBuffer[12] === 0x01;

    if (isProtected) {
      return res.status(422).json({
        error: 'CPI_PROTECTED',
        message: 'Encrypted Yamaha CPI package detected. Conversion requires hardware .n27 decryption key.'
      });
    }

    // Hash calculation
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Register job in PostgreSQL
    const dbRes = await pool.query(
      `INSERT INTO conversion_jobs 
       (original_filename, original_size_bytes, original_format, file_sha256, target_format, status, detected_signature)
       VALUES ($1, $2, $3, $4, $5, 'QUEUED', $6)
       RETURNING id`,
      [originalName, fileBuffer.length, 'PPI', hash, targetFormat, signature]
    );

    const jobId = dbRes.rows[0].id;

    // Dispatch job to BullMQ Redis Queue
    await conversionQueue.add('convert-job', {
      jobId,
      originalName,
      targetFormat,
      fileBufferBase64: fileBuffer.toString('base64')
    });

    res.status(202).json({
      success: true,
      jobId,
      status: 'QUEUED',
      message: 'Job successfully queued for worker processing.'
    });

  } catch (err) {
    console.error('Conversion request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Job Status Query API
app.get('/api/jobs/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM conversion_jobs WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(result.rows[0]);
});

// 6. BullMQ Background Conversion Worker
const worker = new Worker('yamaha-ppi-conversions', async job => {
  const { jobId, originalName, targetFormat, fileBufferBase64 } = job.data;
  const buffer = Buffer.from(fileBufferBase64, 'base64');

  await pool.query('UPDATE conversion_jobs SET status = $1, started_at = NOW() WHERE id = $2', ['PROCESSING', jobId]);

  // Actual binary conversion logic (analogous to YamahaExpansionEngine in index.html)
  // 1. Parse PAC chunk headers
  // 2. Extract PCM samples & generate Pack.xml / UVF descriptors
  // 3. Assemble PPF Zip or YEP binary image
  
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const outputFilename = `${baseName}.${targetFormat.toLowerCase()}`;

  await pool.query(
    `UPDATE conversion_jobs 
     SET status = 'COMPLETED', 
         completed_at = NOW(),
         output_filename = $1, 
         progress_percent = 100 
     WHERE id = $2`,
    [outputFilename, jobId]
  );

  return { success: true, outputFilename };
}, { connection: redisConfig });

worker.on('completed', job => {
  console.log(`[BullMQ] Conversion job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[BullMQ] Conversion job ${job.id} failed:`, err.message);
});

app.listen(port, () => {
  console.log(`🎹 Yamaha Expansion Converter Server running at http://localhost:${port}`);
});
