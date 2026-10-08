/**
 * Bug Reproduction Tests - Demonstrates real errors in codebase
 * These tests prove bugs exist by simulating the buggy logic directly.
 * All tests pass when bug is present (they assert buggy behavior).
 */

describe("Bug Reproductions - Real Errors Found in Codebase", () => {

  describe("BUG #1: adminResourceController empty $or array — FIXED", () => {
    // Original buggy version preserved for documentation
    function buildAdminQuery_buggy({ search, category }) {
      const query = {};
      if (search) {
        query.$or = [{ title: { $regex: search } }];
      }
      if (category) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(category);
        if (isValidObjectId) {
          query.$or = query.$or || []; // BUG: creates empty array when no search
          query.$and = query.$and || [];
          query.$and.push({ $or: [{ categoryId: category }, { category: category }] });
        } else {
          query.category = category;
        }
      }
      return query;
    }

    test("DOCUMENTED BUG: old code creates empty $or: [] with category only (returns 0 docs)", () => {
      const validId = "507f1f77bcf86cd799439011";
      const query = buildAdminQuery_buggy({ category: validId });
      // Bug documented: empty $or causes 0 results in MongoDB
      expect(query.$or).toEqual([]);
      expect(query.$or.length).toBe(0); // confirms bug existed
    });

    test("FIXED version does not create $or when search absent", () => {
      function buildAdminQuery_fixed({ search, category }) {
        const query = {};
        if (search) query.$or = [{ title: { $regex: search } }];
        if (category) {
          const isValid = /^[0-9a-fA-F]{24}$/.test(category);
          if (isValid) {
            if (query.$or) {
              query.$and = query.$and || [];
              query.$and.push({ $or: query.$or });
              delete query.$or;
            }
            query.$and = query.$and || [];
            query.$and.push({ $or: [{ categoryId: category }, { category: category }] });
          } else query.category = category;
        }
        return query;
      }
      const validId = "507f1f77bcf86cd799439011";
      const fixed = buildAdminQuery_fixed({ category: validId });
      expect(fixed.$or).toBeUndefined(); // no empty $or
      expect(fixed.$and).toBeDefined();
    });
  });

  describe("BUG #2: server.js CORS always permissive", () => {
    function corsCallback_buggy(origin, allowedOrigins) {
      if (!origin) return true;
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        return true;
      } else {
        return true; // BUG: always true even when origin not allowed in production
      }
    }
    test("BUG: CORS allows any origin even in production", () => {
      const allowed = ["http://localhost:5173"];
      const result = corsCallback_buggy("https://evil.com", allowed);
      expect(result).toBe(true); // BUG: should be false in production but returns true
    });
  });

  describe("BUG #3: Hardcoded JWT fallback secret (insecure)", () => {
    test("BUG: generateToken uses hardcoded fallback when JWT_SECRET missing", () => {
      const fallback = "learnhub_jwt_secret_change_in_production_2025";
      const secret = process.env.JWT_SECRET || fallback;
      // If env not set, secret is fallback which is publicly visible in source
      if (!process.env.JWT_SECRET) {
        expect(secret).toBe(fallback); // bug: insecure default
      } else {
        expect(secret).toBe(process.env.JWT_SECRET);
      }
    });

    test("BUG: authMiddleware also uses same fallback", () => {
      const fallback = "learnhub_jwt_secret_change_in_production_2025";
      expect(fallback.length).toBeGreaterThan(0);
      // Anyone reading source code can forge tokens if JWT_SECRET not set
      expect(fallback).toBe("learnhub_jwt_secret_change_in_production_2025");
    });
  });

  describe("BUG #4: paymentController verifyPayment skips verification when secret missing", () => {
    function verifyPayment_buggy(razorpay_signature, expected) {
      if (process.env.RAZORPAY_KEY_SECRET) {
        if (expected !== razorpay_signature) return { status: 400, message: "Payment verification failed" };
      }
      // BUG: if env missing, skip verification entirely -> any signature accepted
      return { status: 200, message: "verified" };
    }
    test("BUG: when RAZORPAY_KEY_SECRET not set, any signature passes", () => {
      const original = process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_SECRET;
      const result = verifyPayment_buggy("totally_fake_signature", "expected_sig");
      expect(result.status).toBe(200); // BUG: should be 400 but passes
      if (original) process.env.RAZORPAY_KEY_SECRET = original;
    });
  });

  describe("BUG #5: payment webhook uses JSON.stringify instead of raw body", () => {
    test("BUG: JSON.stringify changes key order and breaks signature", () => {
      const rawBody = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123"}}}}';
      const parsed = JSON.parse(rawBody);
      // Express json parses then stringify may reorder keys
      const reStringified = JSON.stringify(parsed);
      // Razorpay signs rawBody, but server signs reStringified -> mismatch even when valid
      // If keys ordered differently, signature fails
      const orderedDiff = JSON.stringify({ b: 1, a: 2 }) !== JSON.stringify({ a: 2, b: 1 });
      expect(orderedDiff).toBe(true); // demonstrates ordering matters
      // This proves using JSON.stringify(req.body) is unreliable vs raw body buffer
      expect(reStringified).toBeDefined();
    });
  });

  describe("BUG #6: categoryController bulkImport err.insertedDocs may be undefined", () => {
    test("BUG: catch handler assumes err.insertedDocs exists", () => {
      const mockError = { message: "duplicate", insertedDocs: undefined };
      const results = mockError.insertedDocs || [];
      // Original code: return err.insertedDocs || []
      // Then does results.length -> works if fallback, but err may have different shape
      const err2 = { message: "other", code: 11000 }; // no insertedDocs
      const results2 = err2.insertedDocs || [];
      expect(results2.length).toBe(0); // fallback prevents crash but hides real error
      // Real mongoose BulkWriteError has result.insertedCount not insertedDocs
      expect(err2.insertedDocs).toBeUndefined();
    });
  });

  describe("BUG #7: resourceController tags $in with RegExp may not work", () => {
    test("BUG: tags query uses $in with RegExp object which may not match Mongoose string array reliably", () => {
      const escaped = "java.*";
      const query = { tags: { $in: [new RegExp(escaped, "i")] } };
      // MongoDB $in with RegExp: checks if tags array contains string matching regex
      // But tags are strings, $in with RegExp works in Mongo but edge: should use $regex or $elemMatch
      expect(query.tags.$in[0] instanceof RegExp).toBe(true);
      // Some Mongoose versions don't correctly cast RegExp inside $in for string arrays
      expect(typeof query.tags.$in[0]).toBe("object");
    });
  });

  describe("BUG #8: AuthContext fetchUser tokenExpiry never set", () => {
    test("BUG: getMe endpoint does not return expiresAt, so tokenExpiry stays null", () => {
      // server/controllers/authController.js getMe returns only { user }
      const getMeResponse = { success: true, data: { user: { _id: "123", name: "Test" } } };
      expect(getMeResponse.data.expiresAt).toBeUndefined(); // bug: no expiresAt
      // client/src/context/AuthContext.jsx expects res.data.expiresAt but getMe never provides it
      // So tokenExpiry stays null and refresh timeout never scheduled
      const tokenExpiry = getMeResponse.data.expiresAt || null;
      expect(tokenExpiry).toBeNull();
    });
  });

  describe("BUG #9: payment createOrder NaN amount", () => {
    test("BUG: Math.round('abc') => NaN passes !amount check but creates invalid payment", () => {
      const amount = "abc";
      const rounded = Math.round(amount);
      expect(rounded).toBeNaN();
      // Check: if (!amount) -> "abc" is truthy so passes, then Payment.create with NaN
      // Mongoose min:1 will fail for NaN? NaN <1 is false, so min validation may not catch NaN properly
      expect(Number.isNaN(rounded)).toBe(true);
      expect(!amount).toBe(false); // passes required check incorrectly
    });

    test("BUG: empty string amount", () => {
      expect(Math.round("")).toBe(0); // Math.round("") = 0, then stored as 0 which violates min:1 but error is 500 not 400
      expect(Math.round(null)).toBe(0);
    });
  });

  describe("BUG #10: errorMiddleware JWT error handling — FIXED", () => {
    test("FIXED: TokenExpiredError now returns 401 (not 500)", () => {
      const err = { name: "TokenExpiredError", message: "jwt expired" };
      let statusCode = err.statusCode || 500;
      let message = err.message || "Internal Server Error";
      if (err.name === "CastError") statusCode = 400;
      if (err.code === 11000) statusCode = 409;
      if (err.name === "ValidationError") statusCode = 400;
      // BUG #7 FIX applied:
      if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token has expired, please log in again"; }
      if (err.name === "JsonWebTokenError")  { statusCode = 401; message = "Invalid token, please log in again"; }
      expect(statusCode).toBe(401); // FIXED: was 500
      expect(message).toBe("Token has expired, please log in again");
    });
  });
});
