import { Schema, model } from 'mongoose';

const photoSchema = new Schema({
  altText: { type: String, required: false, default: '!' },
  format: { type: String, required: false, default: '' },
  height: { type: Number, required: false, default: null },
  label: { type: String, default: '' },
  name: { type: String, required: false, default: '' },
  publicId: { type: String, required: true },
  size: { type: Number, required: false, default: null },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  url: { type: String, required: true },
  width: { type: Number, required: false, default: null },
}, { timestamps: true });

const Photo = model('Photo', photoSchema);

export default Photo;
