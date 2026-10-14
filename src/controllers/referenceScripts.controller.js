import {
  ReferenceScript,
  Photo,
  SolfaScript,
  Song,
  getPagination,
  isValidObjectId,
  pickScriptFields,
  pickSongFields,
  withSession,
  withOptionalTransaction,
} from '../models/index.js';

import { handleError, throwError } from '../utils/errors/index.js';
import { Roles } from '../utils/roles.js';
import StatusCodes from '../utils/statusCodes.js';

export const listScripts = async (req, res) => {
  try {
    const {
      archived,
      editor,
      devotionalFocus,
      liturgicalFunction,
      liturgicalSeason,
      musicalStyle,
      q,
    } = req.query;
    const { limit, page, skip } = getPagination(req);

    let query;

    if (q) {
      query = { $text: { $search: q, $caseSensitive: false } };
    }
    if (editor) {
      query ||= {};

      if (editor === 'none') {
        query.editor = null;
      } else if (isValidObjectId(editor)) {
        query.editor = editor;
      } else {
        query.editor = req.user._id;
      }
    }

    if (!query) {
      if (req.user.role === Roles.ADMIN || req.user.role === Roles.SUPER_ADMIN) {
        query = {};
      } else {
        query = { $or: [{ editor: req.user._id }, { editor: null }] };
      }
    }

    if (archived === undefined) {
      query.isArchived = false;
    } else {
      query.isArchived = archived === 'true';
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

    const [scripts, total] = await Promise.all([
      ReferenceScript.find(query).populate([
        {
          path: 'photos',
          select: 'url alt format name',
        },
        {
          path: 'song',
        },
      ]).skip(skip).limit(limit).lean(),
      ReferenceScript.countDocuments(query)
    ]);

    res.status(200).json({
      items: scripts,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getScript = async (req, res) => {
  try {
    const { id } = req.params;

    const script = await ReferenceScript.findById(id).populate([
      {
        path: 'photos',
        select: 'url alt format name',
      },
      {
        path: 'song',
      },
    ]).lean();

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.status(200).json(script);
  } catch (error) {
    handleError(error, res);
  }
};

export const createScript = async (req, res) => {
  try {
    const scriptData = req.body;

    await ReferenceScript.create({
      ...scriptData,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ status: 'success' });
  } catch (error) {
    handleError(error, res);
  }
};

export const claimEdit = async (req, res) => {
  let referenceScript;
  let song;
  let script;

  const cleanup = async () => {
    if (script) {
      try {
        await SolfaScript.findByIdAndDelete(script._id);
      } catch {
        // ignore errors during cleanup
      }
    }
    if (song) {
      try {
        await Song.findByIdAndDelete(song._id);
      } catch {
        // ignore errors during cleanup
      }
    }
    if (referenceScript) {
      try {
        referenceScript.editor = null;
        referenceScript.song = null;
        await referenceScript.save();
      } catch {
        // ignore errors during cleanup
      }
    }
  };

  try {
    const result = await withOptionalTransaction(ReferenceScript, async (session) => {
      const { body: { type, script: scriptData }, params: { id } } = req;

      if (!(scriptData && ['solfa'].includes(type))) {
        return {
          error: true,
          status: StatusCodes.BAD_REQUEST,
          data: { message: 'Invalid script or type' },
        };
      }
      
      referenceScript = await withSession(
        ReferenceScript.findById(id), session,
      );

      if (!referenceScript) {
        return {
          error: true,
          status: StatusCodes.NOT_FOUND,
          data: { message: 'Script not found' },
        };
      }
      
      referenceScript = referenceScript.toObject();

      if (referenceScript.editor) {
        referenceScript = null;

        return {
          error: true,
          status: StatusCodes.FORBIDDEN,
          data: { message: 'You are not allowed to claim edit for this script' },
        };
      }

      const formData = { ...referenceScript, ...scriptData };
      const songFormData = pickSongFields(formData);
      const scriptFormData = pickScriptFields(formData);
      
      script = await withSession(
        SolfaScript.create(scriptFormData), session,
      );

      if (!script) {
        referenceScript = null;

        return {
          error: true,
          status: StatusCodes.UNPROCESSABLE_ENTITY,
          data: { message: 'Failed to create Solfa script' },
        };
      }

      song = await withSession(
        Song.create({
          ...songFormData,
          editor: req.user._id,
          solfaScript: script._id,
        }), session,
      );

      if (!song) {
        referenceScript = null;

        return {
          error: true,
          status: StatusCodes.UNPROCESSABLE_ENTITY,
          data: { message: 'Failed to create Song' },
        };
      }

      await withSession(
        ReferenceScript.findByIdAndUpdate(
          referenceScript._id,
          { editor: req.user._id, song: song._id },
          { new: true }
        ), session,
      );

      return { error: false, status: 200, data: { status: 'success', _id: script._id } };
    });

    if (result.error) {
      cleanup();
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    cleanup();
    handleError(error, res);
  }
};

export const updateScript = async (req, res) => {
  try {
    const {
      body: { script: solfaScript, scriptRef, editor },
      params: { id },
    } = req;
    const updateData = {};

    if (solfaScript) {
      if (!scriptRef) {
        throwError('scriptRef is required when updating the script', 400);
      }

      updateData.script = solfaScript;
      updateData.scriptRef = scriptRef;
    }
    if (editor) {
      if (!isValidObjectId(editor)) {
        throwError('Invalid editor ID', 400);
      }

      updateData.editor = editor;
    }

    if (Object.keys(updateData).length === 0) {
      throwError('No valid fields provided for update', 400);
    }

    const script = await ReferenceScript.findById(id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    Object.assign(script, updateData);
    await script.save();

    res.status(200).json({ status: 'success' });
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteScript = async (req, res) => {
  try {
    const { id } = req.params;

    const script = await ReferenceScript.findByIdAndDelete(id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    try {
      await Photo.deleteMany({ _id: { $in: script.photos } });
      // we should delete from cloud also
    } catch (cleanupError) {
      // Ignore cleanup errors for now
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    handleError(error, res);
  }
};
