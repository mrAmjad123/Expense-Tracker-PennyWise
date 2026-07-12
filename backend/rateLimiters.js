const rateLimit = require("express-rate-limit");

function limiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

module.exports = {
  loginLimiter: limiter(MINUTE, 5, "Too many login attempts. Please try again in a minute."),
  signupLimiter: limiter(HOUR, 10, "Too many signup attempts. Please try again later."),
  otpLimiter: limiter(10 * MINUTE, 10, "Too many attempts. Please try again later."),
  passwordResetLimiter: limiter(HOUR, 3, "Too many password reset requests. Please try again later."),
};
