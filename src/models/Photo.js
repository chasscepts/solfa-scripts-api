import { Schema, model } from 'mongoose';

const photoSchema = new Schema({
  altText: { type: String, required: false, default: '!' },
  format: { type: String, required: false, default: '' },
  height: { type: Number, required: false, default: null },
  name: { type: String, required: false, default: '' },
  publicId: { type: String, required: true },
  size: { type: Number, required: false, default: null },
  url: { type: String, required: true },
  width: { type: Number, required: false, default: null },
}, { timestamps: true });

const Photo = model('Photo', photoSchema);

export default Photo;
