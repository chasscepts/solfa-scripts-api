import { User, getPagination } from '../models/index.js';

import { handleError } from '../utils/errors/index.js';
import StatusCodes from '../utils/statusCodes.js';

export const listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { query: {
      role,
      q,
      status,
      deleted,
    }} = req;
    const filter = { isDeleted: false };

    if (role) filter.role = role;
    if (q) filter.$text = { $search: q, $caseSensitive: false };
    if (status) filter.status = status;
    if (deleted === 'true') filter.isDeleted = true;

    const [users, total] = await Promise.all([
      await User
        .find(filter)
        .skip(skip)
        .limit(limit)
        .lean(),
      await User.countDocuments(filter),
    ]);

    res.json({
      items: users,
      pagination: {
        limit,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false }).lean();

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updates,
    );

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found.' });
    }

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true }
    );

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found.' });
    }

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    handleError(error, res);
  }
};
