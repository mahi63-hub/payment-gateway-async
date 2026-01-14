const Queue = require("bull");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const paymentQueue = new Queue("payment-queue", REDIS_URL);

module.exports = {
  paymentQueue,
};
