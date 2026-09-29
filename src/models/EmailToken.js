import { Schema, model } from 'mongoose';

const emailTokenSchema = new Schema({
  consumedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed, default: {}, required: true },
  tokenHash: { type: String, required: true },
  type: { type: String, enum: ['email_verify', 'password_reset', 'phone_verify'], required: true },
  subject: { type: Schema.Types.ObjectId, refPath: 'subjectRef', required: true },
  subjectRef: { type: String, required: true },
}, { timestamps: true });

emailTokenSchema.index({ tokenHash: 1 }, { name: 'email_tokens_token_hash_idx' });
emailTokenSchema.index({ type: 1 }, { name: 'email_tokens_type_idx' });
emailTokenSchema.index({ subject: 1 }, { name: 'email_tokens_subject_idx' });

const EmailToken = model('EmailToken', emailTokenSchema);

export default EmailToken;
