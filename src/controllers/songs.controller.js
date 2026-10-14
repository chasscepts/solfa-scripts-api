import {
  ReferenceScript,
  Song,
  getPagination,
  isValidObjectId,
  pickSongFields,
} from '../models/index.js';

import { handleError } from '../utils/errors/index.js';
import { Roles } from '../utils/roles.js';

export const listSongs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const query = { isPublished: true, isDeleted: false };

    const [songs, total] = await Promise.all([
      Song.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Song.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      items: songs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const listSongsAdmin = async (req, res) => {
  try {
    const {
      editor,
      devotionalFocus,
      liturgicalFunction,
      liturgicalSeason,
      musicalStyle,
      published,
      q,
    } = req.query;
    const { limit, page, skip } = getPagination(req);

    let query;

    if (q) {
      query = { $text: { $search: q, $caseSensitive: false } };
    }
    if (editor) {
      query ||= {};

      if (isValidObjectId(editor)) {
        query.editor = editor;
      } else {
        query.editor = req.user._id;
      }
    }

    if (!query) {
      if (req.user.role === Roles.ADMIN || req.user.role === Roles.SUPER_ADMIN) {
        query = {};
      } else {
        query = { editor: req.user._id };
      }
    }

    if (published === 'true') {
      query.isPublished = true;
    } else if (published === 'false') {
      query.isPublished = false;
    }
    if (devotionalFocus) {
      query.devotionalFocus = devotionalFocus;
    }
    if (liturgicalFunction) {
      query.liturgicalFunction = liturgicalFunction;
    }
    if (liturgicalSeason) {
      query.liturgicalSeason = liturgicalSeason;
    }
    if (musicalStyle) {
      query.musicalStyle = musicalStyle;
    }

    const [songs, total] = await Promise.all([
      Song.find(query).skip(skip).limit(limit).lean(),
      Song.countDocuments(query)
    ]);

    res.status(200).json({
      items: songs,
      pagination: {
        limit,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getSong = async (req, res) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id).lean();

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json(song);
  } catch (error) {
    return handleError(error, res);
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const songData = req.body;

    const song = await Song.findByIdAndUpdate(id, songData, { new: true }).lean();

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const fields = pickSongFields(song);

    if (fields.description) {
      delete song.description;
    }

    if (Object.keys(fields).length > 0) {
      await ReferenceScript.findOneAndUpdate(
        { song: song._id },
        { $set: fields },
      );
    }

    res.status(200).json(song);
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    const song = await Song.findByIdAndUpdate(id, { isDeleted: true });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    return handleError(error, res);
  }
};
