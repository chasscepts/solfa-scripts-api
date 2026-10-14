import { Schema, model } from 'mongoose';

import { SONG_RESOURCE_TYPES_LIST } from '../utils/constants/songs.js';

const songResourceSchema = new Schema({
  song: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  type: { type: String, enum: SONG_RESOURCE_TYPES_LIST, required: true },
  url: { type: String, required: true },
  description: { type: String, required: false, default: '' },
}, { timestamps: true });

const SongResource = model('SongResource', songResourceSchema);

export default SongResource;
