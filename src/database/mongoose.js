/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
import mongoose from 'mongoose';

import config from '../config/index.js';

export const connectDb = () => {
  const connect = mongoose.connect(config.db.url, {})
    .then(
      () => { console.log('✅ The database is now connected ...'); },
      (err) => { console.log(`❌ Can not connect to the database${err?.message || err}`); },
    );

  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
  }

  return connect;
};
