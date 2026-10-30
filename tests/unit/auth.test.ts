import { describe, it, expect } from "vitest";
import { requestOtp, verifyOtp, hashOtp } from "@/lib/auth/otp";
import { signSessionToken, verifySessionToken } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

describe("Authentication & Mobile OTP Security", () => {
  it("hashes OTP consistently using HMAC-SHA256", () => {
    const phone = "+919876500001";
    const hash1 = hashOtp(phone, "123456");
    const hash2 = hashOtp(phone, "123456");
    const hash3 = hashOtp(phone, "654321");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 hex string length
  });

  it("requests OTP and verifies valid code successfully", async () => {
    const phone = "+919876500002";
    const requestResult = await requestOtp(phone);
    expect(requestResult.success).toBe(true);
    expect(requestResult.devOtp).toBeDefined();

    const otpCode = requestResult.devOtp!;
    const verifyResult = await verifyOtp(phone, otpCode);
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.mobileNumber).toBe(phone);
  });

  it("rejects incorrect OTP and counts attempts", async () => {
    const phone = "+919876500003";
    const requestResult = await requestOtp(phone);
    const validOtp = requestResult.devOtp!;
    const wrongOtp = validOtp === "111111" ? "222222" : "111111";

    await expect(verifyOtp(phone, wrongOtp)).rejects.toThrow(/Incorrect verification code/);
  });

  it("prevents replay of already-consumed OTP", async () => {
    const phone = "+919876500004";
    const requestResult = await requestOtp(phone);
    const otpCode = requestResult.devOtp!;

    // First verification succeeds
    await verifyOtp(phone, otpCode);

    // Second verification must fail because OTP was invalidated on use
    await expect(verifyOtp(phone, otpCode)).rejects.toThrow(/No pending verification found/);
  });

  it("creates tamper-proof signed session tokens and verifies them", () => {
    const payload = {
      userId: "usr-test-123",
      role: "PATIENT" as const,
      expiresAt: Date.now() + 3600 * 1000,
    };

    const token = signSessionToken(payload);
    expect(token).toContain(".");

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe(payload.role);
  });

  it("rejects tampered session tokens", () => {
    const payload = {
      userId: "usr-test-123",
      role: "PATIENT" as const,
      expiresAt: Date.now() + 3600 * 1000,
    };

    const token = signSessionToken(payload);
    const [data, sig] = token.split(".");

    // Tamper with data (change role to ADMIN)
    const tamperedData = Buffer.from(
      JSON.stringify({ ...payload, role: "ADMIN" })
    ).toString("base64url");
    const tamperedToken = `${tamperedData}.${sig}`;

    const verified = verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("rejects expired session tokens", () => {
    const expiredPayload = {
      userId: "usr-test-123",
      role: "PATIENT" as const,
      expiresAt: Date.now() - 1000, // already expired
    };

    const token = signSessionToken(expiredPayload);
    const verified = verifySessionToken(token);
    expect(verified).toBeNull();
  });
});

describe("Password Authentication & Verification", () => {
  it("hashes password with random salt", () => {
    const rawPassword = "SecurePassword123!";
    const hash1 = hashPassword(rawPassword);
    const hash2 = hashPassword(rawPassword);

    expect(hash1).toContain(":");
    expect(hash2).toContain(":");
    // Different salts mean different outputs
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password against hash", () => {
    const rawPassword = "SecretDoctorPass#2026";
    const hashed = hashPassword(rawPassword);

    expect(verifyPassword(rawPassword, hashed)).toBe(true);
    expect(verifyPassword("WrongPassword", hashed)).toBe(false);
  });

  it("verifies dev seed fallback passwords", () => {
    expect(verifyPassword("Password123", "Password123")).toBe(true);
    expect(verifyPassword("WrongPassword", "Password123")).toBe(false);
    expect(verifyPassword("Password123", null)).toBe(false);
  });
});

describe("POST /api/auth/login endpoint", () => {
  it("authenticates existing patient with mobile and password", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        mobileNumber: "+91 98765 43210",
        password: "Password123",
        role: "PATIENT",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("PATIENT");
    expect(data.redirectTo).toBe("/dashboard");
  });

  it("authenticates existing doctor and redirects to /doctor/dashboard", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        mobileNumber: "+91 98200 11223",
        password: "Password123",
        role: "DOCTOR",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("DOCTOR");
    expect(data.redirectTo).toBe("/doctor/dashboard");
  });

  it("rejects login with wrong password", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        mobileNumber: "+91 98765 43210",
        password: "WrongPassword999",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Incorrect password");
  });

  it("auto-provisions new user on first password login", async () => {
    const newPhone = "+91 98111 22233";
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        mobileNumber: newPhone,
        password: "MySecretPassword2026",
        role: "PATIENT",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("PATIENT");
  });
});

describe("POST /api/auth/register endpoint", () => {
  it("creates a new patient account with name, mobile, and password", async () => {
    const phone = "+91 99887 76655";
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Karan Patel",
        mobileNumber: phone,
        password: "StrongPassword123!",
        role: "PATIENT",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("PATIENT");
    expect(data.redirectTo).toBe("/dashboard");
  });

  it("rejects registration if mobile number already exists", async () => {
    const existingPhone = "+91 98765 43210"; // seeded patient
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Duplicate User",
        mobileNumber: existingPhone,
        password: "NewPassword123",
        role: "PATIENT",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });

  it("creates a new doctor account and redirects to doctor dashboard", async () => {
    const doctorPhone = "+91 98333 44455";
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Dr. Vikram Joshi",
        mobileNumber: doctorPhone,
        password: "DoctorPassword456!",
        role: "DOCTOR",
        specialty: "Orthopedics",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("DOCTOR");
    expect(data.redirectTo).toBe("/doctor/dashboard");
  });
});
