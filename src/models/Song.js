import { Schema, model } from 'mongoose';

const songSchema = new Schema({
  composer: { type: String, required: false, default: '' },
  description: { type: String, required: false, default: '' },
  devotionalFocus: { type: String, required: false, default: '' },
  editor: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  isDeleted: { type: Boolean, required: false, default: false },
  isPublished: { type: Boolean, required: false, default: false },
  liturgicalFunction: { type: String, required: false, default: '' },
  liturgicalSeason: { type: String, required: false, default: '' },
  musicalStyle: { type: String, required: false, default: '' },
  solfaScript: { type: Schema.Types.ObjectId, ref: 'SolfaScript', required: false, default: null },
  staffScript: { type: Schema.Types.ObjectId, ref: 'StaffScript', required: false, default: null },
  title: { type: String, required: false, default: '' },
}, { timestamps: true });

songSchema.index({ title: 'text', composer: 'text', description: 'text' });
songSchema.index({ devotionalFocus: 1 });
songSchema.index({ liturgicalFunction: 1 });
songSchema.index({ liturgicalSeason: 1 });
songSchema.index({ musicalStyle: 1 });
songSchema.index({ editor: 1 });

const Song = model('Song', songSchema);

export default Song;
