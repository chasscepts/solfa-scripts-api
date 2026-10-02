import { ExternalScript, Photo } from '../models/index.js';

import { handleError, throwError } from '../utils/errors/index.js';
import { isValidObjectId } from '../utils/models.js';

export const listScripts = async (req, res) => {
  try {
    const { editor } = req.query;
    let { offset = 0, page = 1 } = req.query;

    offset = Number.parseInt(offset) || 0;
    page = Number.parseInt(page) || 1;

    const query = {};

    if (editor) {
      if (editor === 'me') {
        query.editor = req.user._id;
      } else if (isValidObjectId(editor)) {
        query.editor = editor;
      }
    }

    const limit = 25;
    const [scripts, total] = await Promise.all([
      ExternalScript.find(query).skip(offset).limit(limit).lean(),
      ExternalScript.countDocuments(query)
    ]);

    res.status(200).json({
      items: scripts,
      meta: {
        page,
        pages: Math.ceil(total / limit),
        total,
        offset,
        limit,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getScript = async (req, res) => {
  try {
    const { id } = req.params;

    const script = await ExternalScript.findById(id).lean();

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.status(200).json(script);
  } catch (error) {
    handleError(res, error);
  }
};

export const createScript = async (req, res) => {
  try {
    const scriptData = req.body;

    await ExternalScript.create({
      ...scriptData,
      uploadedBy: req.user._id,
    });

    console.log('External script created successfully');

    res.status(201).json({ status: 'success' });
  } catch (error) {
    handleError(res, error);
  }
};

export const claimEdit = async (req, res) => {
  try {
    const { id } = req.params;

    const script = await ExternalScript.findById(id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    if (script.editor) {
      return res.status(403).json({ message: 'You are not allowed to claim edit for this script' });
    }

    script.editor = req.user._id;
    await script.save();

    res.status(200).json({ status: 'success' });
  } catch (error) {
    handleError(res, error);
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

    const script = await ExternalScript.findById(id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    Object.assign(script, updateData);
    await script.save();

    res.status(200).json({ status: 'success' });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteScript = async (req, res) => {
  try {
    const { id } = req.params;

    const script = await ExternalScript.findByIdAndDelete(id);

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
    handleError(res, error);
  }
};
