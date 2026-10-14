import { Schema, model } from 'mongoose';

const staffScriptSchema = new Schema({
  title: { type: String, required: true },
  composer: { type: String, required: false, default: '' },
  devotionalFocus: { type: String, required: false, default: '' },
  editor: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  isArchived: { type: Boolean, required: false, default: false },
  isDeleted: { type: Boolean, required: false, default: false },
  isPublished: { type: Boolean, required: false, default: false },
  liturgicalFunction: { type: String, required: false, default: '' },
  liturgicalSeason: { type: String, required: false, default: '' },
  musicalStyle: { type: String, required: false, default: '' },
}, { timestamps: true });

const StaffScript = model('StaffScript', staffScriptSchema);

export default StaffScript;
