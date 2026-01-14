require("dotenv").config();
const Queue = require("bull");
const { Pool } = require("pg");
const axios = require("axios");
const crypto = require("crypto");

const REDIS_URL = process.env.REDIS_URL;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const paymentQueue = new Queue("payment-queue", REDIS_URL);

const WEBHOOK_URL = "http://host.docker.internal:4000/webhook";
const WEBHOOK_SECRET = "whsec_test_abc123";

function signPayload(payload) {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

console.log("Worker running with webhook support...");

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

paymentQueue.process(async (job) => {
  const { paymentId } = job.data;

  const result = await pool.query(
    "SELECT * FROM payments WHERE id=$1",
    [paymentId]
  );

  if (result.rows.length === 0) return;

  const payment = result.rows[0];

  await sleep(3000);

  const isSuccess = Math.random() < 0.9;
  const status = isSuccess ? "success" : "failed";

  await pool.query(
    "UPDATE payments SET status=$1 WHERE id=$2",
    [status, paymentId]
  );

  const event = `payment.${status}`;

  const payload = {
    event,
    data: { payment },
    timestamp: Math.floor(Date.now() / 1000),
  };

  const signature = signPayload(payload);

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      timeout: 5000,
    });

    await pool.query(
      "INSERT INTO webhook_logs (event, payload, status, response_code) VALUES ($1,$2,$3,$4)",
      [event, payload, "success", response.status]
    );

    console.log("Webhook delivered:", event);
  } catch (err) {
    await pool.query(
      "INSERT INTO webhook_logs (event, payload, status) VALUES ($1,$2,$3)",
      [event, payload, "failed"]
    );

    console.log("Webhook failed:", event);
  }
});
