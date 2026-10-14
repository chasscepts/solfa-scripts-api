import mongoose from 'mongoose';

import {
  SolfaScript,
  Song,
  fillScriptFields,
  getPagination,
  pickScriptFields,
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

export const createScript = async (req, res) => {
  let script;
  let song;

  const cleanup = async () => {
    if (script) {
      try {
        await SolfaScript.deleteOne({ _id: script._id });
      } catch {
        // ignore any errors while deleting the script
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
    const result = await withOptionalTransaction(SolfaScript, async (session) => {
      const songData = pickSongFields(req.body);

      song = await withSession(Song.create(songData), session);

      if (!song) {
        return { error: true, status: StatusCodes.UNPROCESSABLE_ENTITY, data: { message: 'Failed to create Song' } };
      }

      const data = pickScriptFields(req.body);

      script = await withSession(SolfaScript.create(data), session);

      if (!script) {
        return { error: true, status: StatusCodes.UNPROCESSABLE_ENTITY, data: { message: 'Failed to create Solfa script' } };
      }

      return { error: false, status: 200, data: script };
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
| GET /api/scripts
|--------------------------------------------------------------------------
*/

export const listScripts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    /*
     * Optional search:
     *
     * GET /api/scripts?search=Amazing
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

    const [scripts, total] = await Promise.all([
      SolfaScript.find(filter)
        .select(
          'title composer tonic meter tempo columns rows satb createdAt updatedAt'
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      SolfaScript.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: scripts,
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
| GET /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const getScript = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const script = await SolfaScript.findById(id).lean();

    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const song = await Song.findOne({ solfaScript: script._id }).lean();

    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Associated song not found.',
      });
    }

    return res.status(200).json(fillScriptFields(script, song));
  } catch (error) {
    return handleError(error, res);
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const updateScript = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const updates = pickScriptFields(req.body);

    console.log(req.body);

    /*
     * Prevent PATCH {} from silently succeeding.
     */
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were supplied for update.',
      });
    }

    const script = await SolfaScript.findOneAndUpdate(
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

    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Script updated successfully.',
      data: script,
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
| DELETE /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const deleteScript = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const script = await SolfaScript.findOneAndUpdate(
      { _id: id },
      { $set: { isDeleted: true } },
      {
        
        context: 'query',
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Script deleted successfully.',
    });
  } catch (error) {
    return handleError(error, res);
  }
};
