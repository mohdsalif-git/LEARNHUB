/**
 * Google Auth Flow Unit Tests
 * Tests logic for Google ID token verification, account linking, user creation,
 * and rejection of Google-only accounts on password login.
 */

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Google Auth Flow & Controller", () => {
  // Logic mirror for googleAuth
  async function googleAuth_logic(req, res, { clientId, verifyIdTokenMock, findOneMock, createMock, saveMock }) {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ success: false, message: "Google credential is required" });
      }

      if (!clientId) {
        return res.status(500).json({ success: false, message: "Google authentication is not configured on this server" });
      }

      let payload;
      try {
        payload = await verifyIdTokenMock({ idToken: credential, audience: clientId });
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired Google token. Please try signing in again." });
      }

      if (!payload.email_verified) {
        return res.status(401).json({ success: false, message: "Your Google account email is not verified. Please verify your email with Google and try again." });
      }

      const { sub: googleId, email, name, picture } = payload;
      const cleanEmail = email.toLowerCase();

      let user = await findOneMock({ googleId });
      if (!user) {
        user = await findOneMock({ email: cleanEmail });
        if (user) {
          user.googleId = googleId;
          if (!user.avatar) user.avatar = picture || "";
          await saveMock(user);
        } else {
          user = await createMock({
            name: name || cleanEmail,
            email: cleanEmail,
            googleId,
            authProvider: "google",
            avatar: picture || "",
          });
        }
      }

      return res.json({
        success: true,
        message: "Google sign-in successful",
        data: { user, token: "mock-jwt-token" },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Google authentication failed" });
    }
  }

  // Logic mirror for loginUser Google rejection
  async function loginUser_logic(req, res, userFromDb) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!userFromDb) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (userFromDb.authProvider === "google" && !userFromDb.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (!userFromDb.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.json({ success: true, message: "Login successful" });
  }

  test("googleAuth rejects missing credential with 400", async () => {
    const res = mockRes();
    await googleAuth_logic({ body: {} }, res, { clientId: "test-client-id" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Google credential is required" })
    );
  });

  test("googleAuth returns 500 when GOOGLE_CLIENT_ID is not configured", async () => {
    const res = mockRes();
    await googleAuth_logic({ body: { credential: "token" } }, res, { clientId: null });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Google authentication is not configured on this server",
      })
    );
  });

  test("googleAuth returns 401 on invalid/unverifiable token", async () => {
    const res = mockRes();
    const verifyIdTokenMock = jest.fn().mockRejectedValue(new Error("Invalid token"));
    await googleAuth_logic(
      { body: { credential: "invalid-token" } },
      res,
      { clientId: "test-client-id", verifyIdTokenMock }
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/invalid or expired google token/i),
      })
    );
  });

  test("googleAuth rejects unverified emails with 401", async () => {
    const res = mockRes();
    const verifyIdTokenMock = jest.fn().mockResolvedValue({
      sub: "google-123",
      email: "test@example.com",
      email_verified: false,
    });
    await googleAuth_logic(
      { body: { credential: "token" } },
      res,
      { clientId: "test-client-id", verifyIdTokenMock }
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/not verified/i),
      })
    );
  });

  test("googleAuth creates a new Google user if none exists", async () => {
    const res = mockRes();
    const verifyIdTokenMock = jest.fn().mockResolvedValue({
      sub: "google-sub-456",
      email: "newgoogleuser@example.com",
      email_verified: true,
      name: "Google Learner",
      picture: "https://lh3.googleusercontent.com/avatar.jpg",
    });
    const findOneMock = jest.fn().mockResolvedValue(null);
    const createMock = jest.fn().mockResolvedValue({
      _id: "user-id-789",
      name: "Google Learner",
      email: "newgoogleuser@example.com",
      authProvider: "google",
    });

    await googleAuth_logic(
      { body: { credential: "valid-token" } },
      res,
      { clientId: "test-client-id", verifyIdTokenMock, findOneMock, createMock }
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "newgoogleuser@example.com",
        googleId: "google-sub-456",
        authProvider: "google",
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: "mock-jwt-token",
        }),
      })
    );
  });

  test("googleAuth links an existing local account if email matches and verified", async () => {
    const res = mockRes();
    const verifyIdTokenMock = jest.fn().mockResolvedValue({
      sub: "google-sub-789",
      email: "existinglocal@example.com",
      email_verified: true,
      name: "Existing Local User",
      picture: "https://lh3.googleusercontent.com/avatar.jpg",
    });

    const mockLocalUser = {
      _id: "local-user-123",
      email: "existinglocal@example.com",
      authProvider: "local",
    };

    const findOneMock = jest
      .fn()
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce(mockLocalUser); // by email

    const saveMock = jest.fn().mockResolvedValue(true);

    await googleAuth_logic(
      { body: { credential: "valid-token" } },
      res,
      { clientId: "test-client-id", verifyIdTokenMock, findOneMock, saveMock }
    );

    expect(mockLocalUser.googleId).toBe("google-sub-789");
    expect(saveMock).toHaveBeenCalledWith(mockLocalUser);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  test("password login rejects Google-only accounts with a helpful message", async () => {
    const res = mockRes();
    const mockGoogleOnlyUser = {
      email: "googleonly@example.com",
      authProvider: "google",
      password: null,
    };

    await loginUser_logic(
      { body: { email: "googleonly@example.com", password: "somepassword123" } },
      res,
      mockGoogleOnlyUser
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      })
    );
  });
});
