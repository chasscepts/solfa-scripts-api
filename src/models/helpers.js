import { hashPassword } from '../utils/encryption.js';
import JWT from '../utils/jwt.js';
import StatusCodes from '../utils/statusCodes.js';

/** @import mongoose from 'mongoose'; */

const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 25;

const SCORE_FIELDS = [
  'tonic',
  'meter',
  'tempo',
  'columns',
  'rows',
  'satb',
  'structuredNotes',
];

const SONG_FIELDS = [
  'title',
  'composer',
  'description',
  'devotionalFocus',
  'liturgicalFunction',
  'liturgicalSeason',
  'musicalStyle',
];

export async function hashPasswordInUpdate() {
  const update = this.getUpdate() || {};

  // Password could be on update.password or update.$set.password
  const nextPassword =
    update.password ??
    (update.$set ? update.$set.password : undefined);

  if (!nextPassword) return;

  const hashed = await hashPassword(String(nextPassword));

  // Put it back in the same place it came from
  if (update.password !== undefined) {
    update.password = hashed;
  }

  if (update.$set && update.$set.password !== undefined) {
    update.$set.password = hashed;
  }

  this.setUpdate(update);
};

export const isValidObjectId = (id) => {
  return id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
};

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
  _id: user._id,
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

export const sessionOptions = (session) => (session ? { session } : undefined);

export const withSession = (query, session) => (session ? query.session(session) : query);

export const fillScoreFields = (score, song) => {
  if (!(score && song)) return score;

  return {
    ...score,
    title: song.title,
    composer: song.composer,
  };
};

export const pickScoreFields = (body = {}) => {
  const data = {};

  for (const field of SCORE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
};

export const pickSongFields = (body, options = { throwOnTitleMissing: true }) => {
  const formData = body ?? {};
  const throwOnTitleMissing = options?.throwOnTitleMissing ?? true;

  if (throwOnTitleMissing && !formData.title) {
    throwError('Title is required', StatusCodes.UNPROCESSABLE_ENTITY);
  }

  const data = {};

  for (const field of SONG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(formData, field)) {
      data[field] = formData[field];
    }
  }

  return data;
};

export const getPagination = (req, defaultLimit) => {
  const page = Math.max(
    Number.parseInt(req.query.page, 10) || 1,
    1
  );

  let limit = Number.parseInt(req.query.limit, 10);

  if (defaultLimit) {
    limit ||= defaultLimit;
  } else {
    limit = Math.min(
      Math.max(
        limit || DEFAULT_PAGE_LIMIT,
        1
      ),
      MAX_PAGE_LIMIT
    );
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
