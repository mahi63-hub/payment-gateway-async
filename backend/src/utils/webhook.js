const crypto = require("crypto");

const WEBHOOK_SECRET = "whsec_test_abc123";

function generateSignature(payload) {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

module.exports = { generateSignature };
