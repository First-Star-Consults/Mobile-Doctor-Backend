import { transferBalance } from './transerBalance.js';

export const calculateFeesAndTransfer = async (patientId, providerId, amount, adminId) => {
  try {
    const providerFeePercentage = 0.95; // 95% to provider
    const adminFeePercentage = 0.05; // 5% to admin

    const providerFee = Math.round(amount * providerFeePercentage * 100) / 100;
    const adminFee = Math.round(amount * adminFeePercentage * 100) / 100;

    console.log('Transfer balance parameters:', {
      patientId,
      providerId,
      providerFee,
      adminId
    });

    console.log('Transfer admin fee parameters:', {
      patientId,
      adminId,
      adminFee
    });

    await transferBalance(patientId, providerId, providerFee, 0, adminId); // Transfer to provider
    await transferBalance(patientId, adminId, adminFee, 0, adminId); // Transfer admin fee

  } catch (error) {
    console.error('Error in fee calculation or transfer:', error);
  }
};
