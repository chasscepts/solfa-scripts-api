import { hashPassword } from '../utils/encryption.js';

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
