const Counter = require("../models/Counter");

const generateInvoiceNumber = async (
  userId,
  session
) => {
  const counter = await Counter.findOneAndUpdate(
    {
      user: userId,
      name: "invoice",
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      session,
    }
  );

  const year = new Date().getFullYear();

  const sequence = String(
    counter.sequence
  ).padStart(6, "0");

  return `INV-${year}-${sequence}`;
};

module.exports = generateInvoiceNumber;