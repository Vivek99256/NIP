import "@testing-library/jest-dom";

// Ensure test environment variables are set
process.env.SESSION_SECRET = "test_super_secure_session_secret_for_vitest_2026_xyz";
process.env.SESSION_COOKIE_NAME = "medrec_session_token";
process.env.SMS_PROVIDER = "MOCK";
process.env.OTP_EXPIRY_SECONDS = "300";
process.env.OTP_RESEND_COOLDOWN_SECONDS = "60";
process.env.OTP_MAX_ATTEMPTS = "3";
process.env.STORAGE_PROVIDER = "LOCAL";
process.env.LOCAL_STORAGE_DIR = "./test_uploads";
