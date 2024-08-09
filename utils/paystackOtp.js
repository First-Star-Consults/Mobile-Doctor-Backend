import { paystack } from './config/paymentService';

export async function submitOtpForTransfer(otp, transferCode) {
  try {
    const body = {
      otp: otp,
      transfer_code: transferCode,
    };

    const response = await paystack.post('/transfer/finalize_transfer', body);
    if (response.data.status === 'success') {
      return { success: true, message: 'Transfer successful', data: response.data.data };
    } else {
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error submitting OTP:', error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
