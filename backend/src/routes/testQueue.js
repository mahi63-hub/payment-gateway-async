const express = require("express");
const router = express.Router();
const { paymentQueue } = require("../config/queue");

router.post("/test-queue", async (req, res) => {
  await paymentQueue.add({
    message: "hello from api",
    time: new Date().toISOString(),
  });

  res.json({ status: "job added to queue" });
});

module.exports = router;
