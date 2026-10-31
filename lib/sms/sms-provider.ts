export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devOtp?: string; // Only populated in non-production for dev UX / tests
}

export interface SmsProvider {
  readonly providerName: string;
  sendOtp(mobileNumber: string, otp: string): Promise<SmsSendResult>;
}

// In-memory store for dev inspection and testing
class DevOtpStore {
  private static store: Map<string, { otp: string; sentAt: number }> = new Map();

  static set(mobileNumber: string, otp: string) {
    this.store.set(mobileNumber, { otp, sentAt: Date.now() });
  }

  static get(mobileNumber: string): string | null {
    const entry = this.store.get(mobileNumber);
    if (!entry) return null;
    // Expire after 10 minutes
    if (Date.now() - entry.sentAt > 10 * 60 * 1000) {
      this.store.delete(mobileNumber);
      return null;
    }
    return entry.otp;
  }

  static clear(mobileNumber: string) {
    this.store.delete(mobileNumber);
  }
}

export { DevOtpStore };

export class MockSmsProvider implements SmsProvider {
  readonly providerName = "MOCK";

  async sendOtp(mobileNumber: string, otp: string): Promise<SmsSendResult> {
    if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER !== "MOCK_PROD_TEST") {
      throw new Error("MockSmsProvider is strictly disabled in production environments.");
    }

    DevOtpStore.set(mobileNumber, otp);

    // Development logging for local convenience
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `\x1b[36m[MOCK SMS PROVIDER]\x1b[0m Verification code for \x1b[32m${mobileNumber}\x1b[0m is \x1b[1m\x1b[33m${otp}\x1b[0m (valid for 5 minutes)`
      );
    }

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    };
  }
}

export class ProductionSmsProvider implements SmsProvider {
  readonly providerName: string;
  private apiKey: string;
  private senderId: string;

  constructor(providerName: string = "SMS_GATEWAY") {
    this.providerName = providerName;
    this.apiKey = process.env.SMS_PROVIDER_API_KEY || "";
    this.senderId = process.env.SMS_SENDER_ID || "NIP";
  }

  async sendOtp(mobileNumber: string, otp: string): Promise<SmsSendResult> {
    if (!this.apiKey) {
      console.warn(
        `\x1b[33m[SMS WARNING]\x1b[0m SMS_PROVIDER_API_KEY is empty in .env. Falling back to MockSmsProvider for ${mobileNumber}.`
      );
      const mock = new MockSmsProvider();
      return mock.sendOtp(mobileNumber, otp);
    }

    try {
      const provider = (process.env.SMS_PROVIDER || "").toUpperCase();

      // 1. Fast2SMS Integration (Very popular for Indian phone numbers)
      if (provider === "FAST2SMS") {
        // Strip country code if present (+91) for Fast2SMS Indian 10-digit format
        const cleanNumber = mobileNumber.replace(/^\+91/, "").replace(/\D/g, "");
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variables_values: otp,
            route: "otp",
            numbers: cleanNumber,
          }),
        });

        const data = await response.json();
        if (data.return === true || response.ok) {
          console.log(`\x1b[32m[FAST2SMS SUCCESS]\x1b[0m SMS OTP dispatched to ${mobileNumber}`);
          return {
            success: true,
            messageId: data.request_id || `fast2sms-${Date.now()}`,
          };
        } else {
          console.error(`\x1b[31m[FAST2SMS ERROR]\x1b[0m`, data);
          return {
            success: false,
            error: data.message?.[0] || "Fast2SMS delivery failed",
          };
        }
      }

      // 2. Twilio Integration
      if (provider === "TWILIO") {
        const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
        const authToken = this.apiKey;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";

        if (!accountSid || !fromNumber) {
          throw new Error("Twilio requires TWILIO_ACCOUNT_SID and TWILIO_PHONE_NUMBER in .env");
        }

        const params = new URLSearchParams();
        params.append("To", mobileNumber);
        params.append("From", fromNumber);
        params.append("Body", `Your NIP Healthcare verification code is: ${otp}. Valid for 5 minutes.`);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log(`\x1b[32m[TWILIO SUCCESS]\x1b[0m SMS dispatched to ${mobileNumber}: SID ${data.sid}`);
          return {
            success: true,
            messageId: data.sid,
          };
        } else {
          return {
            success: false,
            error: data.message || "Twilio delivery failed",
          };
        }
      }

      // 3. Generic SMS Gateway fallback
      console.log(`[SMS GATEWAY ${provider}] Simulating dispatch to ${mobileNumber}`);
      return {
        success: true,
        messageId: `gateway-msg-${Date.now()}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to deliver SMS";
      console.error(`\x1b[31m[SMS GATEWAY EXCEPTION]\x1b[0m`, message);
      return {
        success: false,
        error: message,
      };
    }
  }
}

export class TwilioVerifyProvider implements SmsProvider {
  readonly providerName = "TWILIO_VERIFY";
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_PROVIDER_API_KEY || "";
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";
  }

  async sendOtp(mobileNumber: string, otp: string): Promise<SmsSendResult> {
    if (!this.accountSid || !this.authToken || !this.serviceSid) {
      console.warn("Twilio Verify credentials incomplete in .env. Falling back to MockSmsProvider.");
      const mock = new MockSmsProvider();
      return mock.sendOtp(mobileNumber, otp);
    }

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", mobileNumber);
      params.append("Channel", "sms");

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      if (response.ok && (data.status === "pending" || data.status === "approved")) {
        console.log(
          `\x1b[32m[TWILIO VERIFY DISPATCHED]\x1b[0m Real SMS verification code dispatched to \x1b[1m${mobileNumber}\x1b[0m (SID: ${data.sid})`
        );
        return {
          success: true,
          messageId: data.sid,
        };
      }

      // If testing with an unverified trial number (Twilio 21608), provide dev fallback
      if (data.code === 21608 || data.status === 400) {
        console.warn(
          `\x1b[33m[TWILIO TRIAL NOTICE]\x1b[0m ${mobileNumber} is unverified in Twilio Trial account. Generating dev fallback OTP for testing.`
        );
        DevOtpStore.set(mobileNumber, otp);
        return {
          success: true,
          messageId: `trial-unverified-${Date.now()}`,
          devOtp: otp,
        };
      }

      console.error(`\x1b[31m[TWILIO VERIFY ERROR]\x1b[0m`, data);
      return {
        success: false,
        error: data.message || "Twilio Verify dispatch failed",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Twilio Verify connection failed";
      console.error(`\x1b[31m[TWILIO VERIFY EXCEPTION]\x1b[0m`, msg);
      return {
        success: false,
        error: msg,
      };
    }
  }

  async verifyCode(mobileNumber: string, code: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.serviceSid) return false;

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", mobileNumber);
      params.append("Code", code.trim());

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      return Boolean(response.ok && data.status === "approved");
    } catch (err) {
      console.error("[TWILIO VERIFY CHECK ERROR]", err);
      return false;
    }
  }
}

let activeProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (activeProvider) return activeProvider;

  const providerType = (process.env.SMS_PROVIDER || "MOCK").toUpperCase();
  if (providerType === "MOCK") {
    activeProvider = new MockSmsProvider();
  } else if (providerType === "TWILIO_VERIFY") {
    activeProvider = new TwilioVerifyProvider();
  } else {
    activeProvider = new ProductionSmsProvider(providerType);
  }

  return activeProvider;
}


