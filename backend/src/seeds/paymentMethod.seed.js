const DEFAULT_PAYMENT_METHODS = [
  { type: 'cash', name: 'Cash', isDefault: true },
  { type: 'debit_card', name: 'Debit Card', isDefault: false },
  { type: 'credit_card', name: 'Credit Card', isDefault: false },
  { type: 'upi', name: 'UPI', isDefault: false },
];

export const seedDefaultPaymentMethods = async (userId) => {
  const PaymentMethodRepository = (await import('../repositories/PaymentMethod.repository.js')).default;

  const methods = DEFAULT_PAYMENT_METHODS.map((m) => ({
    userId,
    ...m,
  }));

  await PaymentMethodRepository.bulkCreate(methods);
};

export default DEFAULT_PAYMENT_METHODS;
