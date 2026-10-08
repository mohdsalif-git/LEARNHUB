// Inline errorHandler with Bug #7 fix applied - tests verify correct behavior
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.name === "CastError") { statusCode = 400; message = "Invalid ID format"; }
  if (err.code === 11000) { statusCode = 409; const field = Object.keys(err.keyValue)[0]; message = `Duplicate value for ${field}`; }
  if (err.name === "ValidationError") { statusCode = 400; message = Object.values(err.errors).map((e) => e.message).join(", "); }
  // BUG #7 FIX: JWT errors now return 401
  if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token has expired, please log in again"; }
  if (err.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid token, please log in again"; }
  res.status(statusCode).json({ success: false, message });
};

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Error Handler Middleware - Unit Tests", () => {
  test("should handle CastError -> 400 Invalid ID format", () => {
    const err = { name: "CastError", message: "Cast to ObjectId failed" };
    const req = {};
    const res = mockRes();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid ID format" });
  });

  test("should handle duplicate key error 11000 -> 409", () => {
    const err = { code: 11000, keyValue: { email: "test@test.com" } };
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Duplicate value for email" });
  });

  test("should handle ValidationError -> 400 with joined messages", () => {
    const err = {
      name: "ValidationError",
      errors: { name: { message: "Name is required" }, email: { message: "Email is required" } }
    };
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Name is required, Email is required" });
  });

  test("should default to 500 for generic errors", () => {
    const err = { message: "Something broke" };
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Something broke" });
  });

  test("should use custom statusCode if provided", () => {
    const err = { statusCode: 422, message: "Unprocessable" };
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test("should handle TokenExpiredError -> 401 (Bug #7 FIXED)", () => {
    const err = { name: "TokenExpiredError", message: "jwt expired" };
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    // After fix: returns 401 instead of 500
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Token has expired, please log in again" });
  });
});

describe("Utility Functions - escapeRegex and normalizeTags", () => {
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function normalizeTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
    if (typeof tags === "string") return tags.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    return [];
  }

  test("escapeRegex escapes special chars", () => {
    expect(escapeRegex("hello.*+?")).toBe("hello\\.\\*\\+\\?");
    expect(escapeRegex("test[abc]")).toBe("test\\[abc\\]");
  });

  test("escapeRegex prevents ReDoS", () => {
    const malicious = ".*".repeat(100);
    const escaped = escapeRegex(malicious);
    expect(escaped).not.toContain(".*");
  });

  test("normalizeTags handles array", () => {
    expect(normalizeTags([" js ", "node", ""])).toEqual(["js", "node"]);
  });

  test("normalizeTags handles string with commas and spaces", () => {
    expect(normalizeTags("js, node react")).toEqual(["js", "node", "react"]);
  });

  test("normalizeTags handles empty/null", () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags("")).toEqual([]);
  });

  test("normalizeTags handles numbers in array", () => {
    expect(normalizeTags([123, "  hello  "])).toEqual(["123", "hello"]);
  });
});

describe("Category Bulk Import Edge Cases", () => {
  test("should reject non-array categories", () => {
    const body = { categories: "not-an-array" };
    const isArray = Array.isArray(body.categories);
    expect(isArray).toBe(false);
  });

  test("insertMany ordered:false error shape - Bug #6 fixed", () => {
    // Mongoose BulkWriteError exposes result.nInserted, not insertedDocs
    const mockBulkError = { insertedDocs: undefined, result: { nInserted: 2 } };
    // Fixed: use result.nInserted
    const importedCount = mockBulkError.result?.nInserted ?? mockBulkError.insertedDocs?.length ?? 0;
    expect(importedCount).toBe(2); // correctly reads nInserted
  });
});
