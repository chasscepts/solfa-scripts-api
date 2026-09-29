/* eslint-disable no-console */
import User from '../../models/User.js';
import config from '../../config/index.js';
import { Roles } from '../../utils/roles.js';

const seed = async () => {
  const admin = await User.findOne({ email: config.defaultSuperAdmin.email });

  if (admin) {
    console.log('%c ✅ Admin already seeded', 'color:yellow;');

    return;
  }

  await User.create({
    firstname: config.defaultSuperAdmin.firstname,
    lastname: config.defaultSuperAdmin.lastname,
    email: config.defaultSuperAdmin.email,
    password: config.defaultSuperAdmin.password,
    role: Roles.SUPER_ADMIN,
  });

  console.log('%c ✅ Successfully seeded the admin table', 'color:green;');
};

const AdminSeeder = { seed };

export default AdminSeeder;
