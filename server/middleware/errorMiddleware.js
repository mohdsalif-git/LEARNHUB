const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // BUG #7 FIX: JWT errors should return 401, not 500
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired, please log in again";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token, please log in again";
  }

  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An internal server error occurred";
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== "test") {
    console.error(`[Unhandled Error] ${req?.method || ""} ${req?.originalUrl || req?.url || ""}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
