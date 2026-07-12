const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message =
    err.message || "Internal Server Error";

  if (err.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.stack,
  });
};

module.exports = {
  errorHandler,
};