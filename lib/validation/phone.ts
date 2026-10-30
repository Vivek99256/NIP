import { parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";
import { AppError } from "@/lib/errors/app-error";

/**
 * Validates and normalizes phone numbers into E.164 standard format (+[country code][number])
 * Default country is 'IN' (India) if international prefix is not provided.
 */
export function normalizePhoneNumber(rawNumber: string, defaultCountry: "IN" | "US" | "GB" = "IN"): string {
  if (!rawNumber || typeof rawNumber !== "string") {
    throw AppError.badRequest("Phone number is required");
  }

  const cleaned = rawNumber.trim();

  try {
    const phoneNumber = parsePhoneNumberWithError(cleaned, defaultCountry);

    if (!phoneNumber.isValid()) {
      throw AppError.badRequest("Please enter a valid mobile number with country code (e.g., +91 98765 43210)");
    }

    // Must be mobile or fixed_or_mobile
    const type = phoneNumber.getType();
    if (type && type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
      throw AppError.badRequest("Only mobile numbers are supported for SMS verification");
    }

    return phoneNumber.format("E.164");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.badRequest("Invalid phone number format. Please check the digits and try again.");
  }
}

export function isValidMobileNumber(rawNumber: string, defaultCountry: "IN" | "US" | "GB" = "IN"): boolean {
  try {
    normalizePhoneNumber(rawNumber, defaultCountry);
    return true;
  } catch {
    return false;
  }
}
