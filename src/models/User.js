import { Schema, model } from 'mongoose';

import { RolesList, Roles } from '../utils/roles.js';
import { STATUSES } from '../utils/constants/index.js';
import { hashPassword as hashUserPassword } from '../utils/encryption.js';
import { hashPasswordInUpdate } from './helpers.js';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  firstname: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, required: true },
  lastname: { type: String, required: true },
  lastLoginAt: { type: Date, default: null },
  password: { type: String, required: true },
  photo: { type: Schema.Types.ObjectId, ref: 'Photo', default: null },
  role: { type: String, enum: RolesList, required: true, default: Roles.USER },
  status: { type: String, enum: STATUSES, default: 'pending', required: true },
}, { timestamps: true });

userSchema.index({ email: 1 }, { name: 'users_email_unique', unique: true });
userSchema.index({ status: 1 }, { name: 'users_status_idx' });
userSchema.index({ isDeleted: 1 }, { name: 'users_is_deleted_idx' });
userSchema.index({ role: 1 }, { name: 'users_role_idx' });
userSchema.index({ firstname: 'text', lastname: 'text', email: 'text' }, { name: 'users_text_index' });

userSchema.pre('save', async function hashUserPasswordBeforeSave() {
  const user = this;

  if (user.isModified('password')) {
    user.password = await hashUserPassword(user.password);
  }
});

userSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
userSchema.pre('updateOne', hashPasswordInUpdate);
userSchema.pre('updateMany', hashPasswordInUpdate);

const User = model('User', userSchema);

export default User;
