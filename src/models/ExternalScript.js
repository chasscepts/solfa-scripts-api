import { Schema, model } from 'mongoose';

const externalScriptSchema = new Schema({
  devotionalFocus: { type: String, required: false, default: '' },
  editor: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  liturgicalFunction: { type: String, required: false, default: '' },
  liturgicalSeason: { type: String, required: false, default: '' },
  musicalStyle: { type: String, required: false, default: '' },
  photos: [{ type: Schema.Types.ObjectId, ref: 'Photo', required: true }],
  script: {  type: Schema.Types.ObjectId, refPath: 'scriptRef', required: false, default: null },
  scriptRef: {
    type: String,
    enum: ['SolfaScript'],
    required() {
      return this.script != null;
    },
  },
  title: { type: String, required: false, default: '' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ExternalScript = model('ExternalScript', externalScriptSchema);

export default ExternalScript;
