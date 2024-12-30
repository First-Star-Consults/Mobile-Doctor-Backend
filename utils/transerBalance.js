//utils/transferBalance
import { Transaction } from '../models/services.js';
import User from '../models/user.js';

/**
 * Function to transfer balance between users and admin.
 * @param {ObjectId} fromUserId - The user ID from whom the balance is being transferred.
 * @param {ObjectId} toUserId - The user ID to whom the balance is being transferred.
 * @param {Number} amount - The amount to transfer.
 * @param {Number} adminFee - The fee to transfer to admin.
 * @param {ObjectId} adminId - The admin user ID.
 * @returns {Promise} - Resolves to a transaction object if successful.
 */
export const transferBalance = async (fromUserId, toUserId, amount, adminFee, adminId) => {
  try {
    console.log(`fromUserId: ${fromUserId}`);
    console.log(`toUserId: ${toUserId}`);
    console.log(`adminId: ${adminId}`);

    // Fetch users involved in the transaction
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    const admin = await User.findById(adminId);

    console.log(`fromUser: ${fromUser}`);
    console.log(`toUser: ${toUser}`);
    console.log(`admin: ${admin}`);

    if (!fromUser || !toUser || !admin) {
      throw new Error('One or more users not found');
    }

    if (isNaN(amount) || isNaN(adminFee)) {
      throw new Error('Invalid amount or admin fee');
    }

    // Round amounts
    const roundedAmount = Math.round(amount * 100) / 100;
    const roundedAdminFee = Math.round(adminFee * 100) / 100;

    if (fromUser.walletBalance < roundedAmount + roundedAdminFee) {
      throw new Error('Insufficient balance');
    }

    // Update balances
    fromUser.walletBalance -= roundedAmount + roundedAdminFee;
    toUser.walletBalance += roundedAmount;
    admin.walletBalance += roundedAdminFee;

    // Save updated user balances
    await fromUser.save();
    await toUser.save();
    await admin.save();

    console.log('Creating debit transaction:', {
      user: fromUserId,
      type: 'debit',
      status: 'success',
      amount: -roundedAmount - roundedAdminFee,
    });

    console.log('Creating credit transaction:', {
      user: toUserId,
      type: 'credit',
      status: 'success',
      amount: roundedAmount,
    });

    console.log('Creating admin transaction:', {
      user: adminId,
      type: 'credit',
      status: 'success',
      amount: roundedAdminFee,
    });

    // Create transactions
    const debitTransaction = new Transaction({
      user: fromUserId,
      type: 'debit',
      status: 'success',
      amount: -roundedAmount - roundedAdminFee,
    });

    const creditTransaction = new Transaction({
      user: toUserId,
      type: 'credit',
      status: 'success',
      amount: roundedAmount,
    });

    const adminTransaction = new Transaction({
      user: adminId,
      type: 'credit',
      status: 'success',
      amount: roundedAdminFee,
    });

    await debitTransaction.save();
    await creditTransaction.save();
    await adminTransaction.save();

    return { debitTransaction, creditTransaction, adminTransaction };
  } catch (error) {
    console.error('Error transferring balance:', error);
    throw new Error('Error transferring balance');
  }
};
