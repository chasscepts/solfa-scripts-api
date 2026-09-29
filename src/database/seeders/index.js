/* eslint-disable no-console */
import AdminSeeder from './admin.seeder.js';
import { connectDb } from '../mongoose.js';

const connect = () => new Promise((resolve, reject) => {
  connectDb()
    .then(() => resolve())
    .catch((err) => reject(err));
});

const seeders = [
  { seeder: AdminSeeder, enabled: true },
];

const seed = async () => {
  try {
    await connect();

    const promises = seeders
      .filter((seeder) => seeder.enabled)
      .map((seeder) => seeder.seeder.seed());

    await Promise.all(promises);

    console.log('%c ✅ Seeding Completed!', 'color:green;');
    process.exit(0);
  } catch (err) {
    console.log(err);
    console.log('%c ❌ Seeding Failed!', 'color:red;');
    process.exit(0);
  }
};

seed().catch((err) => {
  console.log(err);
  process.exit(1);
});
