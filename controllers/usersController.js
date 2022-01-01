const User = require('../models/userModel');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');
const factoryHandler = require('./factoryHandler');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'Success',
    results: users.length,
    data: users,
  });
});

const requiredFields = (obj, ...allowedFields) => {
  const newObj = {};
  allowedFields.forEach((field) => {
    Object.keys(obj).forEach((el) => {
      if (field === el) newObj[el] = obj[field];
    });
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Check if the user is trying to change the password because there is a special route for it.
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError('Incorrect route: you can not use it to change your password', 400)
    );
  }
  const filteredObj = requiredFields(req.body, 'email', 'name');
  const newUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'Success',
    data: newUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndUpdate(
    { _id: req.user.id },
    { active: false },
    {
      new: true,
    }
  );
  res.status(204).json({
    status: 'Success',
    data: deletedUser,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUsers = factoryHandler.getAll(User);
exports.getUser = factoryHandler.getOne(User);
exports.updateUser = factoryHandler.updateOne(User);
exports.createUser = factoryHandler.createOne(User);
exports.deleteUser = factoryHandler.deleteOne(User);
