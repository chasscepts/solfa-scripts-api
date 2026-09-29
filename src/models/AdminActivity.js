import { Schema, model } from 'mongoose';

const adminActivitySchema = new Schema({
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  meta: { type: Schema.Types.Mixed, default: null },
  action: { required: true, trim: true, type: String },
  description: { trim: true, type: String },
  ips: { required: true, type: [String] },
  payload: { default: {}, type: Schema.Types.Mixed },
}, { timestamps: true });

const AdminActivity = model('AdminActivity', adminActivitySchema);

export default AdminActivity;
