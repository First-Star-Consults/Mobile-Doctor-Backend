import { transferBalance } from './transerBalance.js';

export const calculateFeesAndTransfer = async (patientId, providerId, amount, adminId) => {
  try {
    // Validate inputs
    if (!patientId || !providerId || !amount || !adminId) {
      console.error('Missing required parameters for transfer:', { patientId, providerId, amount, adminId });
      throw new Error('Missing required parameters for transfer');
    }

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

    // Transfer to provider
    const providerTransferResult = await transferBalance(patientId, providerId, providerFee, 0, adminId);
    console.log('Provider transfer result:', providerTransferResult);
    
    // Transfer admin fee
    const adminTransferResult = await transferBalance(patientId, adminId, adminFee, 0, adminId);
    console.log('Admin transfer result:', adminTransferResult);

    return { providerTransferResult, adminTransferResult };
  } catch (error) {
    console.error('Error in fee calculation or transfer:', error);
    throw error; // Re-throw the error so it can be caught by the caller
  }
};
