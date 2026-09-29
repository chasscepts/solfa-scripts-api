import { Schema, model } from 'mongoose';

const logSchema = new Schema({
  level: { type: String, required: false, enum: ['log', 'info', 'warn', 'error'], default: 'log' },
  logger: { type: Schema.Types.ObjectId, refPath: 'loggerRef', required: false },
  loggerRef: { type: String, enum: ['User'], required: false },
  message: { type: String, required: false, default: '!' },
  metadata: { type: Schema.Types.Mixed, default: null },
  source: { type: String, required: false, default: '!' },
}, { timestamps: true });

const Log = model('Log', logSchema);

export default Log;
