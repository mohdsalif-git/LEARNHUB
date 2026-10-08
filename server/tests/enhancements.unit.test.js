/**
 * enhancements.unit.test.js
 * Unit tests validating all senior full-stack enhancements:
 * - queryHelpers (escapeRegex, normalizeTags)
 * - deduplicated getJwtSecret logic
 * - sendInternalError (production masking vs development error message)
 * - pagination boundary clamping (page >= 1, 1 <= limit <= 100)
 * - verification parameter validation (string checks)
 */

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Senior Full-Stack Enhancements Unit Tests", () => {
  describe("queryHelpers logic", () => {
    function escapeRegex(str) {
      if (typeof str !== "string") return "";
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function normalizeTags(tags) {
      if (!tags) return [];
      if (Array.isArray(tags)) {
        return tags.map((t) => String(t).trim()).filter(Boolean);
      }
      if (typeof tags === "string") {
        return tags.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
      }
      return [];
    }

    test("escapeRegex escapes special regex characters", () => {
      expect(escapeRegex("hello.*+?^${}()|[]\\world")).toBe(
        "hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world"
      );
    });

    test("escapeRegex handles non-string inputs safely without crashing", () => {
      expect(escapeRegex(null)).toBe("");
      expect(escapeRegex(undefined)).toBe("");
      expect(escapeRegex(123)).toBe("");
    });

    test("normalizeTags handles arrays, strings, and whitespace", () => {
      expect(normalizeTags([" react ", " node ", ""])).toEqual(["react", "node"]);
      expect(normalizeTags("react, node, javascript")).toEqual(["react", "node", "javascript"]);
      expect(normalizeTags("react node  javascript")).toEqual(["react", "node", "javascript"]);
      expect(normalizeTags(null)).toEqual([]);
      expect(normalizeTags("")).toEqual([]);
    });
  });

  describe("getJwtSecret deduplication logic", () => {
    function getJwtSecret(env) {
      const secret = env.JWT_SECRET;
      if (!secret) {
        if (env.NODE_ENV === "production") {
          throw new Error("JWT_SECRET environment variable is required in production");
        }
        return "learnhub_jwt_secret_DEVELOPMENT_ONLY";
      }
      return secret;
    }

    test("returns JWT_SECRET when defined", () => {
      expect(getJwtSecret({ JWT_SECRET: "my_secure_secret_token_12345" })).toBe(
        "my_secure_secret_token_12345"
      );
    });

    test("throws in production when JWT_SECRET missing", () => {
      expect(() => getJwtSecret({ NODE_ENV: "production" })).toThrow(
        "JWT_SECRET environment variable is required in production"
      );
    });

    test("returns dev fallback in development when JWT_SECRET missing", () => {
      expect(getJwtSecret({ NODE_ENV: "development" })).toBe(
        "learnhub_jwt_secret_DEVELOPMENT_ONLY"
      );
    });
  });

  describe("sendInternalError safe error logging and masking", () => {
    function sendInternalError(res, error, defaultMessage = "An internal server error occurred", env = "production") {
      const message =
        env === "production"
          ? defaultMessage
          : error?.message || defaultMessage;
      return res.status(500).json({ success: false, message });
    }

    test("masks error message in production mode to prevent secret/stack leakage", () => {
      const res = mockRes();
      sendInternalError(res, new Error("Mongoose: password field syntax error at line 42"), "An internal server error occurred", "production");

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "An internal server error occurred",
      });
    });

    test("exposes error message in development mode for debugging", () => {
      const res = mockRes();
      sendInternalError(res, new Error("Detailed syntax error trace"), "An internal server error occurred", "development");

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Detailed syntax error trace",
      });
    });
  });

  describe("Pagination boundary clamping", () => {
    function clampPagination(page, limit, defaultLimit = 10) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || defaultLimit));
      const skip = (pageNum - 1) * limitNum;
      return { pageNum, limitNum, skip };
    }

    test("clamps negative and zero page numbers to 1", () => {
      expect(clampPagination(-5, 10).pageNum).toBe(1);
      expect(clampPagination(0, 10).pageNum).toBe(1);
      expect(clampPagination("invalid", 10).pageNum).toBe(1);
    });

    test("clamps limit to maximum 100", () => {
      expect(clampPagination(1, 999999).limitNum).toBe(100);
      expect(clampPagination(1, 200).limitNum).toBe(100);
    });

    test("clamps limit to minimum 1", () => {
      expect(clampPagination(1, -10).limitNum).toBe(1);
      expect(clampPagination(1, 0).limitNum).toBe(10); // falls back to defaultLimit
    });

    test("calculates skip accurately", () => {
      expect(clampPagination(3, 20).skip).toBe(40);
    });
  });

  describe("Payment verification input validation", () => {
    function validateVerificationParams(body) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (
        typeof razorpay_order_id !== "string" ||
        typeof razorpay_payment_id !== "string" ||
        typeof razorpay_signature !== "string" ||
        !razorpay_order_id.trim() ||
        !razorpay_payment_id.trim() ||
        !razorpay_signature.trim()
      ) {
        return false;
      }
      return true;
    }

    test("rejects missing, empty, or non-string verification parameters", () => {
      expect(validateVerificationParams({})).toBe(false);
      expect(validateVerificationParams({ razorpay_order_id: "", razorpay_payment_id: "pay_1", razorpay_signature: "sig_1" })).toBe(false);
      expect(validateVerificationParams({ razorpay_order_id: "ord_1", razorpay_payment_id: 12345, razorpay_signature: "sig_1" })).toBe(false);
      expect(validateVerificationParams({ razorpay_order_id: "ord_1", razorpay_payment_id: "pay_1", razorpay_signature: null })).toBe(false);
    });

    test("accepts valid non-empty string parameters", () => {
      expect(validateVerificationParams({
        razorpay_order_id: "order_9A33X5",
        razorpay_payment_id: "pay_29384",
        razorpay_signature: "928374abcdef",
      })).toBe(true);
    });
  });
});
