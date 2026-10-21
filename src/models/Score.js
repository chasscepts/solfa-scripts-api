import mongoose from 'mongoose';

import { validateCanonicalScoreDocument, SCORE_FORMATS, SCORE_VERSIONS } from '../utils/canonicalScore.js';

const { Schema } = mongoose;

const ScoreSchema = new Schema({
  format: { type: String, enum: SCORE_FORMATS, required: true },
  isDeleted: { type: Boolean, default: false },
  layout: { type: [Schema.Types.Mixed], required: true },
  score: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, enum: SCORE_VERSIONS, required: true },
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
