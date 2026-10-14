import { v2 } from 'cloudinary';

import config from '../config/index.js';
import { Photo } from '../models/index.js';
import { throwError, handleError } from '../utils/errors/index.js';
import { generateUniqueString } from '../utils/random.js';
import StatusCodes from '../utils/statusCodes.js';

const cloudEnvs = config.cloudinary;

const allowedFolders = [
  'reference-scripts', 'solfa-scripts', 'staff-scripts',
  'profile-photos',
];

const getFolder = (folder) => {
  if (!(folder && allowedFolders.includes(folder))) {
    throwError(`Invalid folder: ${folder}`, StatusCodes.BAD_REQUEST);
  }

  return `${cloudEnvs.folder}/${folder}`;
};

// POST /uploads/cloudinary/sign
// Body: { folder, publicId, tags, transformations }
export const cloudinarySign = async (req, res) => {
  try {
    const folder = getFolder(req.body.folder);
    const config = {
      api_key: cloudEnvs.apiKey,
      api_secret: cloudEnvs.apiSecret,
      cloud_name: cloudEnvs.cloudName,
    };

    v2.config(config);

    const publicId = req.body.publicId || generateUniqueString();
    const tags = req.body.tags || null;
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      folder,
      timestamp,
      public_id: publicId,
    };

    if (tags) {
      paramsToSign.tags = Array.isArray(tags) ? tags.join(',') : String(tags);
    }

    const signature = v2.utils.api_sign_request(paramsToSign, cloudEnvs.apiSecret);

    const data = {
      apiKey: config.api_key,
      cloudName: config.cloud_name,
      folder,
      publicId,
      signature,
      timestamp,
    };

    if (paramsToSign.tags) {
      data.tags = paramsToSign.tags;
    }

    return res.json(data);
  } catch (err) {
    return handleError(err, res);
  }
};

export const createPhoto = async (req, res) => {
  try {
    const {
      body: {
        altText = '!',
        format = '',
        height = null,
        label = '',
        name = '',
        publicId,
        size = null,
        url,
        width = null,
      }
    } = req;

    if (!(publicId && url)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.CLOUDINARY_REQUIRED || 'publicId and url are required' });
    }

    const data = { altText, publicId, url, uploadedBy: req.user._id };

    if (format) data.format = format;
    if (height) data.height = height;
    if (name) data.name = name;
    if (size) data.size = size;
    if (width) data.width = width;
    if (label) data.label = label;

    const photo = await Photo.create(data);

    return res.status(StatusCodes.CREATED).json({ data: photo });
  } catch (err) {
    return handleError(err, res);
  }
};
