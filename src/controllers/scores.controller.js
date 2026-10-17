import mongoose from 'mongoose';

import {
  Score,
  Song,
  fillScoreFields,
  getPagination,
  pickScoreFields,
  pickSongFields,
  withOptionalTransaction,
  withSession,
} from '../models/index.js';
import { handleError } from '../utils/errors/index.js';
import StatusCodes from '../utils/statusCodes.js';

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

const sendValidationError = (res, error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: Object.fromEntries(
        Object.entries(error.errors).map(([field, value]) => [
          field,
          value.message,
        ])
      ),
    });
  }

  return null;
};

export const createScore = async (req, res) => {
  let score;
  let song;

  const cleanup = async () => {
    if (score) {
      try {
        await Score.deleteOne({ _id: score._id });
      } catch {
        // ignore any errors while deleting the score
      }
    }
    if (song) {
      try {
        await Song.deleteOne({ _id: song._id });
      } catch {
        // ignore any errors while deleting the song
      }
    }
  };

  try {
    const result = await withOptionalTransaction(Score, async (session) => {
      const songData = pickSongFields(req.body);

      song = await withSession(Song.create(songData), session);

      if (!song) {
        return { error: true, status: StatusCodes.UNPROCESSABLE_ENTITY, data: { message: 'Failed to create Song' } };
      }

      const data = pickScoreFields(req.body);

      score = await withSession(Score.create(data), session);

      if (!score) {
        return { error: true, status: StatusCodes.UNPROCESSABLE_ENTITY, data: { message: 'Failed to create Score' } };
      }

      return { error: false, status: 200, data: score };
    });

    if (result.error) {
      cleanup();
    }

    return res.status(result.status).json(result.data);
  } catch (error) {
    cleanup();

    const handled = sendValidationError(res, error);

    if (handled) {
      return handled;
    }

    return handleError(error, res);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/scores
|--------------------------------------------------------------------------
*/

export const listScores = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    /*
     * Optional search:
     *
     * GET /api/scores?search=Amazing
     */
    const search = String(req.query.search || '').trim();

    const filter = {};

    if (search) {
      /*
       * Escape regex characters so user input cannot create
       * an uncontrolled regular expression.
       */
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      filter.title = {
        $regex: escapedSearch,
        $options: 'i',
      };
    }

    const [scores, total] = await Promise.all([
      Score.find(filter)
        .select(
          'title composer tonic meter tempo columns rows satb createdAt updatedAt'
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Score.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: scores,
      meta: {
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

/*
|--------------------------------------------------------------------------
|| GET /api/scores/:id
|--------------------------------------------------------------------------
*/

export const getScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    const score = await Score.findById(id).lean();

    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    const song = await Song.findOne({ score: score._id }).lean();

    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Associated song not found.',
      });
    }

    return res.status(200).json(fillScoreFields(score, song));
  } catch (error) {
    return handleError(error, res);
  }
};

/*
|--------------------------------------------------------------------------
|| PATCH /api/scores/:id
|--------------------------------------------------------------------------
*/

export const updateScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    const updates = pickScoreFields(req.body);

    /*
     * Prevent PATCH {} from silently succeeding.
     */
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were supplied for update.',
      });
    }

    const score = await Score.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: updates,
      },
      {
        context: 'query',
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully.',
      data: score,
    });
  } catch (error) {
    const handled = sendValidationError(res, error);

    if (handled) {
      return handled;
    }

    return handleError(error, res);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE /api/scores/:id
|--------------------------------------------------------------------------
*/

export const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    const score = await Score.findOneAndUpdate(
      { _id: id },
      { $set: { isDeleted: true } },
      {
        
        context: 'query',
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Score deleted successfully.',
    });
  } catch (error) {
    return handleError(error, res);
  }
};
