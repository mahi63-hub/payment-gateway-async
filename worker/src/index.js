require("dotenv").config();
const Queue = require("bull");
const { Pool } = require("pg");

const REDIS_URL = process.env.REDIS_URL;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const paymentQueue = new Queue("payment-queue", REDIS_URL);

console.log("Worker running and waiting for payments...");

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

paymentQueue.process(async (job) => {
  const { paymentId } = job.data;

  console.log("Processing payment:", paymentId);

  // fetch payment
  const result = await pool.query(
    "SELECT method FROM payments WHERE id = $1",
    [paymentId]
  );

  if (result.rows.length === 0) {
    console.log("Payment not found:", paymentId);
    return;
  }

  const method = result.rows[0].method;

  // simulate delay (5–10 sec)
  const delay = Math.floor(Math.random() * 5000) + 5000;
  await sleep(delay);

  // success rates
  let successRate = method === "upi" ? 0.9 : 0.95;
  const isSuccess = Math.random() < successRate;

  if (isSuccess) {
    await pool.query(
      "UPDATE payments SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2",
      ["success", paymentId]
    );
    console.log("Payment SUCCESS:", paymentId);
  } else {
    await pool.query(
      "UPDATE payments SET status=$1, error_code=$2, error_description=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4",
      ["failed", "PAYMENT_FAILED", "Transaction declined", paymentId]
    );
    console.log("Payment FAILED:", paymentId);
  }
});
