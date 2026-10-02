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
  'does not support retryable writes',
];

const isTransactionUnsupportedError = (err) => {
  const errors = [err];
  const seen = new Set();

  while (errors.length) {
    const current = errors.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;

    seen.add(current);
    const message = `${current.message || ''} ${current.errmsg || ''} ${current.codeName || ''}`.toLowerCase();
    if (transactionUnsupportedMessages.some((part) => message.includes(part))) return true;

    errors.push(current.cause, current.errorResponse, current.originalError);
  }

  return false;
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
