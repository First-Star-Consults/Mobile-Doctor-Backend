//config/paymentService.js
import axios from 'axios';
import User from '../models/user.js'; 

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function chargePatient(email, amount) {
  // Convert amount to kobo for Paystack (e.g., NGN 100 = 10000 kobo)
  const body = {
    email: email,
    amount: amount * 100,
    currency: "NGN",
    // Additional details like callback URL, metadata, etc., can be included here
  };

  try {
    const response = await paystack.post('/transaction/initialize', body);
    return response.data.data.authorization_url; // Direct user to this URL to complete payment
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function verifyTransaction(reference) {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    // Paystack transaction verification response
    const data = response.data.data;

    if (data.status === 'success') {
      // Transaction was successful
      return { success: true, data };
    } else {
      // Transaction was not successful
      return { success: false, message: 'Transaction not successful' };
    }
  } catch (error) {
    console.error(error);
    // An error occurred during the verification process
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function validateAccountNumber(account_number, bank_code) {
  try {
    console.log(`Validating account number: ${account_number} with bank code: ${bank_code}`);
    const response = await paystack.get(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`);
    
    if (response.data.data) {
      console.log('Account validation successful:', response.data.data);
      return response.data.data;
    } else {
      console.log('Account validation returned no data.');
      throw new Error('Account validation returned no data.');
    }
  } catch (error) {
    console.error('Error validating account number:', {
      account_number,
      bank_code,
      error: error.response?.data || error.message
    });
    throw error;
  }
}



export async function creditWallet(email, amount) {
    try {
      // Find the user by email
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new Error('User not found');
      }
  
      // Convert amount to the appropriate unit if necessary (e.g., NGN 100 = 10000 kobo)
      // Assuming amount is already in the correct unit here
  
      // Update the user's wallet balance
      user.walletBalance = (user.walletBalance || 0) + amount; // Ensure there's a default value
  
      // Save the updated user
      await user.save();
  
      // Return a success response or the updated user object
      return { success: true, message: 'Wallet credited successfully', user: user };
    } catch (error) {
      console.error('Error crediting wallet:', error);
      return { success: false, message: error.message };
    }
  }

  // export async function createTransferRecipient(name, accountNumber, bankCode) {
  //   try {
  //     const body = {
  //       type: "nuban",
  //       name: name,
  //       account_number: accountNumber,
  //       bank_code: bankCode,
  //       currency: "NGN"
  //     };
  //     const response = await paystack.post('/transferrecipient', body);
  //     return response.data.data; // Contains recipient_code needed for transfer
  //   } catch (error) {
  //     console.error('Error creating transfer recipient:', error);
  //     return null;
  //   }
  // }

  export async function createTransferRecipient(name, accountNumber, bankCode) {
    try {
      const body = {
        type: "nuban",
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
      };
      const response = await paystack.post('/transferrecipient', body);
      console.log('Response:', response.data);
      return response.data.data; // Contains recipient_code needed for transfer
    } catch (error) {
      console.error('Error creating transfer recipient:', error);
      return null;
    }
  }
  
  export async function initiateTransfer(amount, recipientCode) {
    try {
      const body = {
        source: "balance", // Transfer from your Paystack balance
        amount: amount * 100, // Convert amount to kobo
        recipient: recipientCode,
        reason: "Withdrawal from Wallet" // This can be any reason
      };
      const response = await paystack.post('/transfer', body);
      return response.data.data; // Contains transfer details
    } catch (error) {
      console.error('Error initiating transfer:', error);
      return null;
    }
  }
  
