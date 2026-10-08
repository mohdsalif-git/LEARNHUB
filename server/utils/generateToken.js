import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    // Development-only fallback (clearly marked as insecure)
    return "learnhub_jwt_secret_DEVELOPMENT_ONLY";
  }
  return secret;
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
};

export { getJwtSecret };
export default generateToken;