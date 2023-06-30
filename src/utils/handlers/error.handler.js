import createError from "http-errors";

export const errorHandler = (err, _req, res, _next) => {
  const error = { ...err };
  error.message = err.message;

  // Firebase errors
  if (err.code === 'PERMISSION_DENIED') {
    error.message = "You don't have permission to access the requested resource.";
    error.status = 403;
  }
  if (err.code === 'UNAUTHORIZED') {
    error.message = "Unauthorized access.";
    error.status = 401;
  }
  if (err.code === 'DATA_LOSS') {
    error.message = "Data loss has been detected.";
    error.status = 500;
  }
  if (err.code === 'NETWORK_ERROR') {
    error.message = "Network error.";
    error.status = 500;
  }

  if (err instanceof createError.HttpError) {
    error.status = err.status;
    error.message = err.message;
  }

  return res.status(error?.status || 500).json({
    message: error?.message,
  });
};
