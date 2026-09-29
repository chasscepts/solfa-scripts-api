import { AdminActivity, Logs } from '../models/index.js';
import { snapshotProps } from '../utils/object.js';

const log = async (message, level = 'info', meta) => {
  try {
    const metadata = meta ? snapshotProps(meta) : {};

    await Logs.create({ message, level, metadata });
  } catch (err) {
    // ignore
  }
};

const Logger = {
  log,
  info: (message, meta) => log(message, 'info', meta),
  warn: (message, meta) => log(message, 'warn', meta),
  error: (message, meta) => log(message, 'error', meta),
  logActivity: async (adminId, details, meta) => {
    try {
      await AdminActivity.create({ admin: adminId, details, meta: meta || '' });
    } catch {
      // ignore
    }
  },
};

export default Logger;
