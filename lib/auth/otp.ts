import crypto from "crypto";
import { normalizePhoneNumber } from "@/lib/validation/phone";
import { rateLimiter } from "@/lib/rate-limit/rate-limiter";
import { getSmsProvider, TwilioVerifyProvider } from "@/lib/sms/sms-provider";
import { AppError } from "@/lib/errors/app-error";

interface StoredOtpChallenge {
  mobileNumber: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: number;
  createdAt: number;
}

// In-memory challenge store (mirrors OtpChallenge model)
const challengeStore: Map<string, StoredOtpChallenge> = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = parseInt(process.env.OTP_EXPIRY_SECONDS || "300", 10) * 1000;
const RESEND_COOLDOWN_MS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || "60", 10) * 1000;
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3", 10);
const HASH_SECRET = process.env.SESSION_SECRET || "default_hmac_secret_for_otp_hashing";

/**
 * Hash an OTP using HMAC-SHA256 with the system secret
 */
export function hashOtp(mobileNumber: string, otp: string): string {
  return crypto
    .createHmac("sha256", HASH_SECRET)
    .update(`${mobileNumber}:${otp}`)
    .digest("hex");
}

/**
 * Generate a cryptographically secure 6-digit random numeric string
 */
export function generateSecureOtp(): string {
  // crypto.randomInt ensures uniform distribution without modulo bias
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Request OTP:
 * - Rate limits by phone and IP
 * - Normalizes phone number
 * - Checks cooldown
 * - Invalidates old challenges
 * - Generates & hashes OTP
 * - Dispatches via SMS provider
 */
export async function requestOtp(
  rawMobile: string,
  ipAddress?: string
): Promise<{ success: boolean; resendAfterSeconds: number; devOtp?: string }> {
  const mobileNumber = normalizePhoneNumber(rawMobile);

  // 1. IP rate limiting: max 10 requests per 10 minutes
  if (ipAddress) {
    const ipLimit = rateLimiter.check(`otp:req:ip:${ipAddress}`, 10, 10 * 60 * 1000);
    if (!ipLimit.success) {
      throw AppError.tooManyRequests("Too many OTP requests from this connection. Please wait 10 minutes.");
    }
  }

  // 2. Phone rate limiting: max 5 requests per 15 minutes
  const phoneLimit = rateLimiter.check(`otp:req:ph:${mobileNumber}`, 5, 15 * 60 * 1000);
  if (!phoneLimit.success) {
    throw AppError.tooManyRequests("Too many OTP requests for this mobile number. Please try again later.");
  }

  // 3. Cooldown check
  const existing = challengeStore.get(mobileNumber);
  const now = Date.now();
  if (existing && now < existing.resendAvailableAt) {
    const remainingSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    throw AppError.badRequest(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
  }

  // 4. Generate & hash OTP
  const otp = generateSecureOtp();
  const codeHash = hashOtp(mobileNumber, otp);

  // 5. Store challenge (invalidates any older challenge for this number)
  challengeStore.set(mobileNumber, {
    mobileNumber,
    codeHash,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    createdAt: now,
  });

  // 6. Deliver OTP via configured SMS provider
  const smsProvider = getSmsProvider();
  const sendResult = await smsProvider.sendOtp(mobileNumber, otp);

  return {
    success: true,
    resendAfterSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    devOtp: sendResult.devOtp,
  };
}

/**
 * Verify OTP:
 * - Checks challenge exists
 * - Verifies expiry
 * - Verifies attempt count
 * - Constant-time comparison
 * - Deletes challenge on success
 */
export async function verifyOtp(
  rawMobile: string,
  candidateOtp: string
): Promise<{ success: boolean; mobileNumber: string }> {
  const mobileNumber = normalizePhoneNumber(rawMobile);

  // 1. If using Twilio Verify live gateway, check with Twilio Verify first
  const smsProvider = getSmsProvider();
  if (smsProvider instanceof TwilioVerifyProvider) {
    const isApproved = await smsProvider.verifyCode(mobileNumber, candidateOtp);
    if (isApproved) {
      challengeStore.delete(mobileNumber);
      return {
        success: true,
        mobileNumber,
      };
    }
  }

  // 2. Fallback to local challenge store (for test numbers, MOCK mode, or dev trial fallback)
  const challenge = challengeStore.get(mobileNumber);

  if (!challenge) {
    throw AppError.badRequest("No pending verification found or code has expired. Please request a new code.");
  }

  const now = Date.now();
  if (now > challenge.expiresAt) {
    challengeStore.delete(mobileNumber);
    throw AppError.badRequest("Verification code has expired. Please request a new code.");
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    challengeStore.delete(mobileNumber);
    throw AppError.badRequest("Maximum verification attempts exceeded. Please request a new code.");
  }

  challenge.attempts += 1;

  const candidateHash = hashOtp(mobileNumber, candidateOtp.trim());
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(challenge.codeHash, "hex")
  );

  if (!isMatch) {
    const remaining = challenge.maxAttempts - challenge.attempts;
    if (remaining <= 0) {
      challengeStore.delete(mobileNumber);
      throw AppError.badRequest("Incorrect code. Maximum attempts exceeded. Please request a new code.");
    }
    throw AppError.badRequest(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
  }

  // Success: invalidate challenge to prevent replay
  challengeStore.delete(mobileNumber);

  return {
    success: true,
    mobileNumber,
  };
}
