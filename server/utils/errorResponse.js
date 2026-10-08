/**
 * Safe server-side error logging and client response helper.
 * Prevents raw internal database/stack errors from leaking to the client in production.
 */
export const sendInternalError = (res, error, defaultMessage = "An internal server error occurred") => {
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Server Error]:`, error);
  }
  const message =
    process.env.NODE_ENV === "production"
      ? defaultMessage
      : error?.message || defaultMessage;
  return res.status(500).json({ success: false, message });
};
