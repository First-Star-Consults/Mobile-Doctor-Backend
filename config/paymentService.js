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
    // Check response data to determine if transaction was successful
    if (response.data.data.status === 'success') {
      // Handle successful transaction (e.g., update user's wallet or confirm service payment)
    }
  } catch (error) {
    console.error(error);
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
  
