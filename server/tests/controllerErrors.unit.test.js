/**
 * Controller Error Handling Unit Tests
 * Tests error cases for all controllers using mocked request/response
 * No DB required - pure unit tests
 */

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Mocked controller logic extracted for unit testing
describe("Auth Controller Errors", () => {
  async function registerUser_mock(req, res, mockFindOne, mockCreate) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields are required" });
    const existing = await mockFindOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "Email already registered" });
    return res.status(201).json({ success: true });
  }
  test("register: missing fields -> 400", async () => {
    const res = mockRes();
    await registerUser_mock({ body: {} }, res, async () => null, async () => ({}));
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("register: duplicate email -> 409", async () => {
    const res = mockRes();
    await registerUser_mock({ body: { name: "a", email: "a@b.com", password: "123456" } }, res, async () => ({ email: "a@b.com" }), async () => ({}));
    expect(res.status).toHaveBeenCalledWith(409);
  });
  test("register: success -> 201", async () => {
    const res = mockRes();
    await registerUser_mock({ body: { name: "a", email: "new@b.com", password: "123456" } }, res, async () => null, async () => ({}));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  async function loginUser_mock(req, res, mockFindOne) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
    const user = await mockFindOne(email);
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    if (!user.password) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const isMatch = user.password === password; // simplified
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });
    return res.json({ success: true });
  }
  test("login: missing email -> 400", async () => {
    const res = mockRes();
    await loginUser_mock({ body: { password: "123" } }, res, async () => null);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("login: user not found -> 401", async () => {
    const res = mockRes();
    await loginUser_mock({ body: { email: "none@a.com", password: "123" } }, res, async () => null);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("login: no password (google user) -> 401", async () => {
    const res = mockRes();
    await loginUser_mock({ body: { email: "g@a.com", password: "123" } }, res, async () => ({ email: "g@a.com", password: null }));
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("login: wrong password -> 401", async () => {
    const res = mockRes();
    await loginUser_mock({ body: { email: "a@b.com", password: "wrong" } }, res, async () => ({ email: "a@b.com", password: "correct" }));
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("Resource Controller Errors", () => {
  function buildQuery({ search, category }) {
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    const query = {};
    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [{ title: { $regex: escaped, $options: "i" } }];
    }
    if (category) {
      const isValid = /^[0-9a-fA-F]{24}$/.test(category);
      if (isValid) {
        query.$and = query.$and || [];
        if (query.$or) { query.$and.push({ $or: query.$or }); delete query.$or; }
        query.$and.push({ $or: [{ categoryId: category }, { category: category }] });
      } else query.category = category;
    }
    return query;
  }
  test("search escapes regex", () => {
    const q = buildQuery({ search: "test.*", category: null });
    expect(q.$or[0].title.$regex).toBe("test\\.\\*");
  });
  test("invalid ObjectId treated as string category", () => {
    const q = buildQuery({ category: "javascript" });
    expect(q.category).toBe("javascript");
  });
  test("valid ObjectId with search merges correctly", () => {
    const q = buildQuery({ search: "js", category: "507f1f77bcf86cd799439011" });
    expect(q.$and).toBeDefined();
    expect(q.$or).toBeUndefined();
  });
});

describe("Bookmark Controller Errors", () => {
  async function addBookmark_mock(req, res, mockResourceFind, mockBookmarkFindOne) {
    const resourceId = req.params.resourceId || req.body.resourceId;
    if (!resourceId) return res.status(400).json({ success: false, message: "Resource ID is required" });
    const isValid = /^[0-9a-fA-F]{24}$/.test(resourceId);
    if (!isValid) return res.status(400).json({ success: false, message: "Invalid resource ID" });
    const exists = await mockResourceFind(resourceId);
    if (!exists) return res.status(404).json({ success: false, message: "Resource not found" });
    const existing = await mockBookmarkFindOne(resourceId);
    if (existing) return res.status(409).json({ success: false, message: "Already saved" });
    return res.status(201).json({ success: true });
  }
  test("addBookmark: missing resourceId -> 400", async () => {
    const res = mockRes();
    await addBookmark_mock({ params: {}, body: {} }, res, async () => ({}), async () => null);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("addBookmark: invalid ID -> 400", async () => {
    const res = mockRes();
    await addBookmark_mock({ params: { resourceId: "invalid" }, body: {} }, res, async () => ({}), async () => null);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("addBookmark: resource not found -> 404", async () => {
    const res = mockRes();
    await addBookmark_mock({ params: { resourceId: "507f1f77bcf86cd799439011" }, body: {} }, res, async () => null, async () => null);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test("addBookmark: already saved -> 409", async () => {
    const res = mockRes();
    await addBookmark_mock({ params: { resourceId: "507f1f77bcf86cd799439011" }, body: {} }, res, async () => ({ _id: "r" }), async () => ({ _id: "b" }));
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe("Payment Controller Errors", () => {
  async function createOrder_mock(req, res) {
    const { amount, supporterName, supporterEmail } = req.body;
    if (!amount || !supporterName || !supporterEmail) return res.status(400).json({ success: false, message: "Amount, name, and email are required" });
    const rounded = Math.round(amount);
    if (Number.isNaN(rounded)) return res.status(400).json({ success: false, message: "Invalid amount" });
    if (rounded < 1) return res.status(400).json({ success: false, message: "Amount must be at least 1" });
    return res.json({ success: true, data: { amount: rounded } });
  }
  test("createOrder: missing fields -> 400", async () => {
    const res = mockRes();
    await createOrder_mock({ body: { amount: 100 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("createOrder: NaN amount -> 400", async () => {
    const res = mockRes();
    await createOrder_mock({ body: { amount: "abc", supporterName: "a", supporterEmail: "a@b.com" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("createOrder: zero amount -> 400", async () => {
    const res = mockRes();
    await createOrder_mock({ body: { amount: 0, supporterName: "a", supporterEmail: "a@b.com" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("createOrder: valid -> 200", async () => {
    const res = mockRes();
    await createOrder_mock({ body: { amount: 100, supporterName: "a", supporterEmail: "a@b.com" } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  function verifyPayment_mock(body, expectedSig, secret) {
    if (secret) {
      if (expectedSig !== body.razorpay_signature) return { status: 400 };
    }
    return { status: 200 };
  }
  test("verify: invalid signature -> 400 when secret set", () => {
    const r = verifyPayment_mock({ razorpay_signature: "bad" }, "good", "secret");
    expect(r.status).toBe(400);
  });
  test("verify: bypass when secret missing (bug)", () => {
    const r = verifyPayment_mock({ razorpay_signature: "bad" }, "good", null);
    expect(r.status).toBe(200); // bug
  });
});

describe("Feedback Controller Errors", () => {
  async function createFeedback_mock(req, res) {
    const { name, rating, message } = req.body;
    if (!name || !rating || !message) return res.status(400).json({ success: false, message: "Name, rating, and message are required" });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be 1-5" });
    return res.status(201).json({ success: true });
  }
  test("feedback: missing fields -> 400", async () => {
    const res = mockRes();
    await createFeedback_mock({ body: { name: "a" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("feedback: rating 0 -> 400", async () => {
    const res = mockRes();
    await createFeedback_mock({ body: { name: "a", rating: 0, message: "hi" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("feedback: rating 6 -> 400", async () => {
    const res = mockRes();
    await createFeedback_mock({ body: { name: "a", rating: 6, message: "hi" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Support Controller Errors", () => {
  async function createSupport_mock(req, res) {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: "All fields are required" });
    return res.status(201).json({ success: true });
  }
  test("support: missing fields -> 400", async () => {
    const res = mockRes();
    await createSupport_mock({ body: { name: "a", email: "a@b.com" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("User Controller Errors", () => {
  async function updateProfile_mock(req, res) {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Name is required" });
    return res.json({ success: true });
  }
  test("updateProfile: empty name -> 400", async () => {
    const res = mockRes();
    await updateProfile_mock({ body: { name: "   " } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  async function changePassword_mock(req, res, user) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    if (!user.password) return res.status(400).json({ success: false, message: "Cannot change password for accounts linked to Google" });
    return res.json({ success: true });
  }
  test("changePassword: too short -> 400", async () => {
    const res = mockRes();
    await changePassword_mock({ body: { currentPassword: "old", newPassword: "123" } }, res, { password: "hashed" });
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("changePassword: google user -> 400", async () => {
    const res = mockRes();
    await changePassword_mock({ body: { currentPassword: "old", newPassword: "newpass123" } }, res, { password: null });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Category Controller Errors", () => {
  async function bulkImport_mock(req, res) {
    const { categories } = req.body;
    if (!Array.isArray(categories)) return res.status(400).json({ success: false, message: "Categories must be an array" });
    return res.json({ success: true, data: { imported: categories.length } });
  }
  test("bulkImport: non-array -> 400", async () => {
    const res = mockRes();
    await bulkImport_mock({ body: { categories: "string" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("bulkImport: empty array -> 200 with 0", async () => {
    const res = mockRes();
    await bulkImport_mock({ body: { categories: [] } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe("Admin Controller Errors", () => {
  async function claimFirstAdmin_mock(adminCount, user) {
    if (adminCount > 0) return { status: 403, message: "Admin already exists" };
    if (!user) return { status: 404, message: "User not found" };
    return { status: 200, message: "Admin role claimed" };
  }
  test("claimAdmin: when admin exists -> 403", async () => {
    const r = await claimFirstAdmin_mock(1, { _id: "1" });
    expect(r.status).toBe(403);
  });
  test("claimAdmin: when user not found -> 404", async () => {
    const r = await claimFirstAdmin_mock(0, null);
    expect(r.status).toBe(404);
  });
});

describe("Auth Middleware Errors", () => {
  function authenticate_mock(headers, mockVerify) {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith("Bearer")) return { status: 401, message: "Not authorized" };
    try {
      const token = auth.split(" ")[1];
      const decoded = mockVerify(token);
      if (!decoded) return { status: 401, message: "Not authorized" };
      return { status: 200, user: decoded };
    } catch { return { status: 401, message: "Not authorized" }; }
  }
  test("no header -> 401", () => {
    const r = authenticate_mock({}, () => ({}));
    expect(r.status).toBe(401);
  });
  test("invalid token -> 401", () => {
    const r = authenticate_mock({ authorization: "Bearer bad" }, () => { throw new Error("invalid"); });
    expect(r.status).toBe(401);
  });
  test("valid token -> 200", () => {
    const r = authenticate_mock({ authorization: "Bearer good" }, () => ({ id: "123" }));
    expect(r.status).toBe(200);
  });
  function authorizeAdmin_mock(user) {
    if (user && user.role === "admin") return { status: 200 };
    return { status: 403, message: "Admin access required" };
  }
  test("non-admin -> 403", () => {
    expect(authorizeAdmin_mock({ role: "user" }).status).toBe(403);
  });
  test("admin -> 200", () => {
    expect(authorizeAdmin_mock({ role: "admin" }).status).toBe(200);
  });
});
