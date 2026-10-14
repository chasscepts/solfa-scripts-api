import { Schema, model } from 'mongoose';

const referenceScriptSchema = new Schema({
  composer: { type: String, required: false, default: '' },
  devotionalFocus: { type: String, required: false, default: '' },
  editor: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  isArchived: { type: Boolean, required: false, default: false },
  liturgicalFunction: { type: String, required: false, default: '' },
  liturgicalSeason: { type: String, required: false, default: '' },
  musicalStyle: { type: String, required: false, default: '' },
  photos: [{ type: Schema.Types.ObjectId, ref: 'Photo', required: true }],
  song: {  type: Schema.Types.ObjectId, ref: 'Song', required: false, default: null },
  title: { type: String, required: false, default: '' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

referenceScriptSchema.index({ title: 'text' });
referenceScriptSchema.index({ editor: 1 });
referenceScriptSchema.index({ devotionalFocus: 1 });
referenceScriptSchema.index({ liturgicalFunction: 1 });
referenceScriptSchema.index({ liturgicalSeason: 1 });
referenceScriptSchema.index({ musicalStyle: 1 });

const ReferenceScript = model('ReferenceScript', referenceScriptSchema);

export default ReferenceScript;
