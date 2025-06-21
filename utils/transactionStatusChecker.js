// utils/transactionStatusChecker.js
import { Transaction } from '../models/services.js';
import { checkTransferStatus } from '../config/paymentService.js';
import User from '../models/user.js';
import { sendNotificationEmail } from '../utils/nodeMailer.js';
import notificationController from '../controllers/notificationController.js';

/**
 * Checks the status of transactions marked as 'verification_needed' with Paystack
 * and updates their status accordingly.
 */
export const checkPendingTransactions = async () => {
  try {
    console.log('Starting scheduled check for verification_needed transactions...');
    
    // Find all transactions that need verification
    const pendingTransactions = await Transaction.find({ 
      status: 'verification_needed',
      transferCode: { $exists: true, $ne: null } // Only check transactions with a transferCode
    }).populate('user');
    
    console.log(`Found ${pendingTransactions.length} transactions needing verification`);
    
    // Process each transaction
    for (const transaction of pendingTransactions) {
      try {
        console.log(`Checking transaction ${transaction._id} with transferCode ${transaction.transferCode}`);
        
        // Check the status with Paystack
        const transferStatus = await checkTransferStatus(transaction.transferCode);
        
        if (!transferStatus.success) {
          console.log(`Failed to check status for transaction ${transaction._id}: ${transferStatus.message}`);
          transaction.notes = `${transaction.notes || ''} | Auto-check failed: ${transferStatus.message}`;
          await transaction.save();
          continue;
        }
        
        const paystackStatus = transferStatus.data.status;
        transaction.notes = `${transaction.notes || ''} | Auto-check result: ${paystackStatus}`;
        
        // If Paystack confirms the transfer was successful
        if (paystackStatus === 'success') {
          const user = transaction.user;
          
          if (!user) {
            console.log(`User not found for transaction ${transaction._id}`);
            transaction.notes = `${transaction.notes} | User not found during auto-check`;
            await transaction.save();
            continue;
          }
          
          // Deduct balance if not already deducted
          // We need to check the wallet balance first to ensure we don't double-deduct
          const currentUser = await User.findById(user._id);
          if (currentUser.walletBalance >= transaction.amount) {
            currentUser.walletBalance -= transaction.amount;
            await currentUser.save();
          }
          
          // Update transaction status
          transaction.status = 'success';
          transaction.completedAt = new Date();
          await transaction.save();
          
          // Send success notification
          await sendNotificationEmail(
            user.email,
            'Withdrawal Successful',
            `Your withdrawal of ₦${transaction.amount} to ${transaction.bankName} (${transaction.accountNumber}) has been completed successfully.`
          );
          
          // Create in-app notification
          try {
            await notificationController.createNotification(
              user._id,
              null,
              'withdrawal',
              `Your withdrawal of ₦${transaction.amount} to ${transaction.bankName} (${transaction.accountNumber}) has been completed successfully.`,
              transaction._id,
              'Transaction'
            );
          } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
          
          console.log(`Transaction ${transaction._id} verified as successful and updated`);
        } 
        // If Paystack confirms the transfer failed
        else if (paystackStatus === 'failed') {
          transaction.status = 'failed';
          await transaction.save();
          console.log(`Transaction ${transaction._id} verified as failed and updated`);
        }
        // For other statuses (pending, etc.), keep as verification_needed
        else {
          console.log(`Transaction ${transaction._id} status is ${paystackStatus}, keeping as verification_needed`);
        }
        
        await transaction.save();
      } catch (error) {
        console.error(`Error processing transaction ${transaction._id}:`, error);
      }
    }
    
    console.log('Completed scheduled check for verification_needed transactions');
  } catch (error) {
    console.error('Error in checkPendingTransactions:', error);
  }
};

/**
 * Sets up a recurring check for pending transactions
 * @param {number} intervalMinutes - How often to check (in minutes)
 */
export const setupTransactionStatusChecker = (intervalMinutes = 30) => {
  console.log(`Setting up transaction status checker to run every ${intervalMinutes} minutes`);
  
  // Run immediately on startup
  checkPendingTransactions();
  
  // Then set up recurring check
  const intervalMs = intervalMinutes * 60 * 1000;
  return setInterval(checkPendingTransactions, intervalMs);
};