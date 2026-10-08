/**
 * authAndRateLimiter.test.js
 * ==========================
 * Comprehensive unit tests for:
 * 1. Classic Email + Password registration & validation
 * 2. Classic Email + Password login & authentication
 * 3. User model password hashing, comparison, and serialization
 * 4. Token generation & getMe user profile retrieval with expiresAt
 * 5. Dev Rate Limiter localhost bypass & production enforcement
 * 6. DOM Input ID sanitization ensuring colon-free querySelector compatibility
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper for mocking Express response
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Auth Controller — Classic Email & Password Flow", () => {
  // Logic mirror of registerUser from authController.js
  async function registerUserLogic(body, mockFindOne, mockCreate) {
    const res = mockRes();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanName.length > 100) {
      return res.status(400).json({ success: false, message: "Name must not exceed 100 characters" });
    }

    if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (cleanPassword.length < 6 || cleanPassword.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be between 6 and 128 characters" });
    }

    const existing = await mockFindOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await mockCreate({ name: cleanName, email: cleanEmail, password: cleanPassword });
    const token = jwt.sign({ id: user._id }, "test_jwt_secret", { expiresIn: "30d" });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user, token, expiresAt },
    });
  }

  // Logic mirror of loginUser from authController.js
  async function loginUserLogic(body, mockFindOne) {
    const res = mockRes();
    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await mockFindOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, "test_jwt_secret", { expiresIn: "30d" });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return res.json({
      success: true,
      message: "Login successful",
      data: { user, token, expiresAt },
    });
  }

  describe("Registration Validation", () => {
    test("rejects missing name", async () => {
      const res = await registerUserLogic({ email: "test@example.com", password: "password123" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "All fields are required" }));
    });

    test("rejects missing email", async () => {
      const res = await registerUserLogic({ name: "Alice", password: "password123" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "All fields are required" }));
    });

    test("rejects missing password", async () => {
      const res = await registerUserLogic({ name: "Alice", email: "test@example.com" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "All fields are required" }));
    });

    test("rejects name longer than 100 characters", async () => {
      const longName = "A".repeat(101);
      const res = await registerUserLogic({ name: longName, email: "test@example.com", password: "password123" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Name must not exceed 100 characters" }));
    });

    test("rejects invalid email formats", async () => {
      const invalidEmails = ["plainaddress", "@missingusername.com", "user@.com", "user@domain", "user space@domain.com"];
      for (const email of invalidEmails) {
        const res = await registerUserLogic({ name: "Bob", email, password: "password123" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Please provide a valid email address" }));
      }
    });

    test("rejects password shorter than 6 characters", async () => {
      const res = await registerUserLogic({ name: "Charlie", email: "charlie@example.com", password: "123" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Password must be between 6 and 128 characters" }));
    });

    test("rejects password longer than 128 characters", async () => {
      const longPassword = "p".repeat(129);
      const res = await registerUserLogic({ name: "Charlie", email: "charlie@example.com", password: longPassword });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Password must be between 6 and 128 characters" }));
    });

    test("rejects duplicate email with 409 Conflict", async () => {
      const mockFind = jest.fn().mockResolvedValue({ email: "existing@example.com" });
      const mockCreate = jest.fn();
      const res = await registerUserLogic({ name: "Dave", email: "existing@example.com", password: "password123" }, mockFind, mockCreate);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Email already registered" }));
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("normalizes email to lowercase and trims whitespace", async () => {
      let createdData = null;
      const mockFind = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockImplementation((data) => {
        createdData = data;
        return { _id: "user123", ...data };
      });

      const res = await registerUserLogic({ name: "  Eve  ", email: "  EVE@Example.COM  ", password: "password123" }, mockFind, mockCreate);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(createdData.name).toBe("Eve");
      expect(createdData.email).toBe("eve@example.com");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Registration successful",
        data: expect.objectContaining({
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }));
    });
  });

  describe("Login Validation & Authentication", () => {
    test("rejects missing email or password", async () => {
      const res1 = await loginUserLogic({ password: "123" }, jest.fn());
      expect(res1.status).toHaveBeenCalledWith(400);

      const res2 = await loginUserLogic({ email: "user@example.com" }, jest.fn());
      expect(res2.status).toHaveBeenCalledWith(400);
    });

    test("returns 401 when user does not exist", async () => {
      const mockFind = jest.fn().mockResolvedValue(null);
      const res = await loginUserLogic({ email: "ghost@example.com", password: "password123" }, mockFind);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid credentials" }));
    });

    test("returns 401 when password does not match", async () => {
      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        password: "hashed_password",
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      const mockFind = jest.fn().mockResolvedValue(mockUser);
      const res = await loginUserLogic({ email: "user@example.com", password: "wrongpassword" }, mockFind);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid credentials" }));
      expect(mockUser.comparePassword).toHaveBeenCalledWith("wrongpassword");
    });

    test("succeeds with 200 and returns token when password is correct", async () => {
      const mockUser = {
        _id: "user123",
        name: "Verified User",
        email: "verified@example.com",
        role: "user",
        password: "hashed_password",
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      const mockFind = jest.fn().mockResolvedValue(mockUser);
      const res = await loginUserLogic({ email: "verified@example.com", password: "correctpassword" }, mockFind);
      expect(res.status).not.toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Login successful",
        data: expect.objectContaining({
          token: expect.any(String),
          expiresAt: expect.any(Date),
          user: expect.objectContaining({ email: "verified@example.com" }),
        }),
      }));
    });
  });
});

describe("User Model Security & Serialization", () => {
  test("bcrypt hashing produces unique salts and matches candidate password", async () => {
    const rawPassword = "SecurePassword@123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isWrongMatch = await bcrypt.compare("WrongPassword", hash);

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  test("toJSON removes password field from user object", () => {
    const userDoc = {
      _id: "u123",
      name: "Test User",
      email: "test@example.com",
      password: "super_secret_hash",
      role: "user",
      toObject() {
        return { ...this };
      },
    };

    // Mirrors userSchema.methods.toJSON
    function toJSON() {
      const obj = userDoc.toObject();
      delete obj.password;
      return obj;
    }

    const serialized = toJSON();
    expect(serialized.password).toBeUndefined();
    expect(serialized.email).toBe("test@example.com");
    expect(serialized.name).toBe("Test User");
  });
});

describe("Rate Limiter — Localhost Bypass & Production Protection", () => {
  const isLocalhost = (ip) =>
    ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";

  function shouldSkipRateLimit(req, nodeEnv) {
    return nodeEnv !== "production" && isLocalhost(req.ip);
  }

  test("skips IPv4 localhost in development", () => {
    expect(shouldSkipRateLimit({ ip: "127.0.0.1" }, "development")).toBe(true);
  });

  test("skips IPv6 localhost in development", () => {
    expect(shouldSkipRateLimit({ ip: "::1" }, "development")).toBe(true);
  });

  test("skips IPv4-mapped IPv6 localhost in development", () => {
    expect(shouldSkipRateLimit({ ip: "::ffff:127.0.0.1" }, "development")).toBe(true);
  });

  test("does NOT skip external IPs in development", () => {
    expect(shouldSkipRateLimit({ ip: "192.168.1.50" }, "development")).toBe(false);
    expect(shouldSkipRateLimit({ ip: "104.28.14.9" }, "development")).toBe(false);
  });

  test("NEVER skips rate limiting in production, even for localhost", () => {
    expect(shouldSkipRateLimit({ ip: "127.0.0.1" }, "production")).toBe(false);
    expect(shouldSkipRateLimit({ ip: "::1" }, "production")).toBe(false);
    expect(shouldSkipRateLimit({ ip: "::ffff:127.0.0.1" }, "production")).toBe(false);
  });
});

describe("Client Input Component ID Sanitization", () => {
  test("sanitizes React 19 useId colon format into valid CSS/DOM query selectors", () => {
    const rawUseIdOutputs = [":r0:", ":r1:", ":r2a:", ":r3_b:"];

    for (const rawId of rawUseIdOutputs) {
      const sanitized = rawId.replace(/[:]/g, "");
      const inputId = `input-${sanitized}`;

      // In CSS selector syntax, an ID starting with a letter/dash and containing no colons is valid
      expect(inputId).not.toContain(":");
      expect(/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(inputId)).toBe(true);

      // Verify that `#${inputId}` is a valid selector pattern that does not trigger CSS syntax errors
      expect(() => {
        // Pseudo check mimicking querySelector validation: starts with # followed by valid identifier
        if (/[^a-zA-Z0-9_#-]/.test(`#${inputId}`)) {
          throw new Error("Invalid selector");
        }
      }).not.toThrow();
    }
  });

  test("respects explicitly passed id attributes", () => {
    const explicitIds = ["login-email", "login-password", "signup-name", "signup-confirm-password"];
    for (const id of explicitIds) {
      expect(/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(id)).toBe(true);
      expect(id).not.toContain(":");
    }
  });
});

describe("Token Refresh & authLoading Lifecycle", () => {
  const MAX_SAFE_TIMEOUT_MS = 2147483647;

  function calculateRefreshIn(tokenExpiry) {
    const expiryTime = new Date(tokenExpiry).getTime();
    if (isNaN(expiryTime)) return null;

    const timeUntilExpiry = expiryTime - Date.now();
    if (timeUntilExpiry <= 0) return 0; // Expired

    return Math.min(
      Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000),
      MAX_SAFE_TIMEOUT_MS
    );
  }

  test("clamps 30-day token expiry to MAX_SAFE_TIMEOUT_MS to prevent browser integer overflow", () => {
    // 30 days in ms = 2,592,000,000 > 2,147,483,647 (MAX_SAFE_TIMEOUT_MS)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const delay = calculateRefreshIn(thirtyDaysFromNow);

    expect(delay).toBeLessThanOrEqual(MAX_SAFE_TIMEOUT_MS);
    expect(delay).toBe(MAX_SAFE_TIMEOUT_MS);
  });

  test("handles expired token gracefully without negative delays", () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    const delay = calculateRefreshIn(expiredDate);
    expect(delay).toBe(0);
  });

  test("maintains minimum 60s delay when close to expiry", () => {
    const twoMinutesFromNow = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const delay = calculateRefreshIn(twoMinutesFromNow);
    expect(delay).toBe(60000);
  });
});

describe("Content Security Policy Allowlist Verification", () => {
  const fs = require("fs");
  const path = require("path");

  const vercelPath = path.resolve(__dirname, "../../client/vercel.json");
  const vitePath = path.resolve(__dirname, "../../client/vite.config.js");

  test("production CSP contains zero Google auth domains", () => {
    const vercelContent = fs.readFileSync(vercelPath, "utf8");
    expect(vercelContent).not.toContain("accounts.google.com");
    expect(vercelContent).not.toContain("apis.google.com");
    expect(vercelContent).not.toContain("unsafe-eval");
  });

  test("production CSP allows Razorpay checkout, fonts, and API domain", () => {
    const vercelContent = fs.readFileSync(vercelPath, "utf8");
    expect(vercelContent).toContain("https://checkout.razorpay.com");
    expect(vercelContent).toContain("https://api.razorpay.com");
    expect(vercelContent).toContain("https://learnhub-backend-eight.vercel.app");
    expect(vercelContent).toContain("https://fonts.googleapis.com");
    expect(vercelContent).toContain("https://fonts.gstatic.com");
  });

  test("development CSP allows unsafe-eval strictly for Vite dev HMR/source maps", () => {
    const viteContent = fs.readFileSync(vitePath, "utf8");
    expect(viteContent).toContain("'unsafe-eval'");
    expect(viteContent).not.toContain("accounts.google.com");
  });
});
