import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "learnhub_jwt_secret_change_in_production_2025",
    { expiresIn: "30d" }
  );
};

export default generateToken;