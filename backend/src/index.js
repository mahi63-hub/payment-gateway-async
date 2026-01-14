const express = require("express");
const cors = require("cors");

const paymentRoutes = require("./routes/payments");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "api running" });
});

app.use("/payments", paymentRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
