import { Queue } from "bullmq";
import Redis from "ioredis";

/**
 * ==============================================================================
 * REDIS & BULLMQ ASYNCHRONOUS JOB QUEUE WITH GRACEFUL OFFLINE DISPATCH
 * ==============================================================================
 */

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let redisClient: Redis | null = null;
let conversionQueue: Queue | null = null;

try {
  if (process.env.ENABLE_REDIS_QUEUE === "true") {
    redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    conversionQueue = new Queue("yamaha-ppi-queue", { connection: redisClient });
  }
} catch (err) {
  console.warn("Redis BullMQ connection not active, using direct in-process conversion:", err);
}

export interface QueueJobPayload {
  jobId: string;
  originalName: string;
  targetFormat: "PPF" | "YEP";
  fileBase64: string;
}

export async function dispatchConversionJob(payload: QueueJobPayload): Promise<boolean> {
  if (conversionQueue) {
    try {
      await conversionQueue.add("convert-pack", payload, {
        attempts: 2,
        removeOnComplete: true,
      });
      return true;
    } catch {
      // Fallback
    }
  }
  return false;
}
