// Needed for the app to function in any environment.
const REQUIRED_ALWAYS = ["JWT_SECRET", "DATABASE_URL", "RECAPTCHA_SECRET_KEY"];

// Have safe dev-only fallbacks (console-logged codes/links, localhost CORS)
// that must not be relied on in a real deployment.
const REQUIRED_IN_PRODUCTION = ["FRONTEND_URL", "SENDGRID_API_KEY", "EMAIL_FROM"];

function validateEnv() {
  const required = [...REQUIRED_ALWAYS, ...(process.env.NODE_ENV === "production" ? REQUIRED_IN_PRODUCTION : [])];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      `Refusing to start: missing required environment variable(s): ${missing.join(", ")}. ` +
        "See backend/.env.example for the full list."
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error(
      "Refusing to start: JWT_SECRET is too short (must be at least 32 characters). " +
        "Use a long random string — e.g. `node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"`."
    );
    process.exit(1);
  }
}

module.exports = validateEnv;
