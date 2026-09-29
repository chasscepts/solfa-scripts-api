import JWT from '../utils/jwt.js';

/** @import mongoose from 'mongoose'; */

/**
 * @callback OptionalTransactionCallback
 * @param {mongoose.ClientSession} [session] - The optional session to use for the transaction.
 * @returns {Promise<*>} The result of the operation.
 */
const transactionUnsupportedMessages = [
  'transaction numbers are only allowed',
  'transactions are not supported',
  'transaction is not supported',
  'replica set member or mongos',
];

const isTransactionUnsupportedError = (err) => {
  const message = `${err?.message || ''} ${err?.codeName || ''}`.toLowerCase();

  return transactionUnsupportedMessages.some((part) => message.includes(part));
};

export const sanitizeUser = (user) => ({
  email: user.email,
  firstname: user.firstname,
  lastname: user.lastname,
  id: user._id,
  status: user.status,
  photo: user.photo,
  profilePhotoUrl: user.photo?.url || null,
  role: user.role,
});

export const authenticatedUser = (user) => ({
  accessToken: JWT.buildAccessToken({ id: user._id, role: user.role }),
  refreshToken: JWT.buildRefreshToken({ id: user._id, role: user.role }),
  user: sanitizeUser(user),
});

export const withOptionalTransaction = (() => {
  let transactionsSupported = true;

  /**
   * Executes a database operation with an optional transaction.
   * If transactions are supported and the model's database connection allows it,
   * the operation will be executed within a transaction.
   * If a transaction is not supported, the operation will be executed without one.
   *
   * @param {mongoose.Model} Model - The Mongoose model to use for the operation.
   * @param {OptionalTransactionCallback} operation - The operation to execute. Receives the session as an argument if a transaction is used.
   * @returns {Promise<*>} The result of the operation.
   */
  return async (Model, operation) => {
    if (!transactionsSupported || typeof Model.db?.startSession !== 'function') {
      return operation();
    }
  
    const session = await Model.db.startSession();
    let retryWithoutTransaction = false;
    let result;
  
    try {
      await session.withTransaction(async () => {
        result = await operation(session);
      });
    } catch (err) {
      if (isTransactionUnsupportedError(err)) {
        transactionsSupported = false;
        retryWithoutTransaction = true;
      } else {
        throw err;
      }
    } finally {
      await session.endSession();
    }
  
    if (retryWithoutTransaction) {
      return operation();
    }
  
    return result;
  };
})();
