const Counter = require("../models/Counter");

const generateInvoiceNumber = async (userId) => {
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
    }
  );

  const year = new Date().getFullYear();

  const sequence = String(
    counter.sequence
  ).padStart(6, "0");

  return `INV-${year}-${sequence}`;
};

module.exports = generateInvoiceNumber;