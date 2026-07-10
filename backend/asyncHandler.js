// Express 4 doesn't catch rejected promises from async route handlers,
// which would otherwise crash the process on any DB error. Wrap every
// async handler with this so errors reach the error-handling middleware.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
