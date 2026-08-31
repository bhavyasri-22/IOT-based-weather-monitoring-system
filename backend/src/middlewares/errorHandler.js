/**
 * Centralized Error Handling Middlewares
 */

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    data: null,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

function globalErrorHandler(err, req, res, next) {
  console.error(`[Global Error Handler] Error: ${err.message}`, err.stack);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
