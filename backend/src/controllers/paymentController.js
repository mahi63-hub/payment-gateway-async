const pool = require("../config/db");
const { paymentQueue } = require("../config/queue");

function generatePaymentId() {
  return "pay_" + Math.random().toString(36).substring(2, 18);
}

exports.createPayment = async (req, res) => {
  const { order_id, amount, method } = req.body;

  const paymentId = generatePaymentId();

  await pool.query(
    "INSERT INTO payments (id, order_id, amount, method, status) VALUES ($1,$2,$3,$4,$5)",
    [paymentId, order_id, amount, method, "pending"]
  );

  await paymentQueue.add({
    paymentId,
  });

  res.status(201).json({
    id: paymentId,
    order_id,
    amount,
    method,
    status: "pending",
  });
};
