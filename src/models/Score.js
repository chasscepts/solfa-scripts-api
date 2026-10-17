import mongoose from 'mongoose';

import { validateCanonicalScoreDocument } from '../utils/canonicalScore.js';

const { Schema } = mongoose;

const ScoreSchema = new Schema({
  composer: { type: String, default: '' },
  format: { type: String, enum: ['choirconnect-canonical-score'], required: true },
  isDeleted: { type: Boolean, default: false },
  layout: { type: [Schema.Types.Mixed], required: true },
  score: { type: Schema.Types.Mixed, required: true },
  title: { type: String, default: '' },
  version: { type: Number, enum: [1], required: true },
}, {
  minimize: false,
  strict: true,
  timestamps: true,
  versionKey: false,
});

ScoreSchema.pre('validate', function () {
  validateCanonicalScoreDocument(this.toObject());
});

const Score = mongoose.model('Score', ScoreSchema);

export default Score;
