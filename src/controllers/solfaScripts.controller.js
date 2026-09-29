import mongoose from 'mongoose';

import SolfaScript from '../models/SolfaScript.js';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

const getPagination = (req) => {
  const page = Math.max(
    Number.parseInt(req.query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT,
      1
    ),
    MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
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

/*
|--------------------------------------------------------------------------
| Allowed fields
|--------------------------------------------------------------------------
|
| Only fields in this list may be written by the client.
| owner is intentionally excluded.
|--------------------------------------------------------------------------
*/

const SCRIPT_FIELDS = [
  'title',
  'composer',
  'tonic',
  'meter',
  'tempo',
  'columns',
  'rows',
  'satb',
  'structuredNotes',
];

const pickScriptFields = (body = {}) => {
  const data = {};

  for (const field of SCRIPT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| POST /api/scripts
|--------------------------------------------------------------------------
*/

export const createScript = async (req, res, next) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const data = pickScriptFields(req.body);

    /*
     * Owner always comes from authentication.
     * Never accept owner/userId/createdBy from the request body.
     */
    const script = await SolfaScript.create({
      ...data,
      owner,
    });

    return res.status(201).json({
      success: true,
      message: 'Script created successfully.',
      data: script,
    });
  } catch (error) {
    const handled = sendValidationError(res, error);

    if (handled) {
      return handled;
    }

    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/scripts
|--------------------------------------------------------------------------
*/

export const listMyScripts = async (req, res, next) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const { page, limit, skip } = getPagination(req);

    /*
     * Optional search:
     *
     * GET /api/scripts?search=Amazing
     */
    const search = String(req.query.search || '').trim();

    const filter = {
      owner,
    };

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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const getScript = async (req, res, next) => {
  try {
    const owner = getUserId(req);
    const { id } = req.params;

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    /*
     * IMPORTANT:
     *
     * owner is part of the query.
     *
     * Therefore a user cannot fetch another user's script even
     * if they somehow know its MongoDB ObjectId.
     */
    const script = await SolfaScript.findOne({
      _id: id,
      owner,
    }).lean();

    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: script,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const updateScript = async (req, res, next) => {
  try {
    const owner = getUserId(req);
    const { id } = req.params;

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const updates = pickScriptFields(req.body);

    /*
     * Prevent PATCH {} from silently succeeding.
     */
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were supplied for update.',
      });
    }

    /*
     * owner is deliberately not included in `updates`.
     *
     * The query is also restricted by owner.
     */
    const script = await SolfaScript.findOneAndUpdate(
      {
        _id: id,
        owner,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
        context: 'query',
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

    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE /api/scripts/:id
|--------------------------------------------------------------------------
*/

export const deleteScript = async (req, res, next) => {
  try {
    const owner = getUserId(req);
    const { id } = req.params;

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found.',
      });
    }

    const script = await SolfaScript.findOneAndDelete({
      _id: id,
      owner,
    });

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
    return next(error);
  }
};
