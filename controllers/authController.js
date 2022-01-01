const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const User = require('../models/userModel');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');
const sendMail = require('../utils/Email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// This function is responsible for sending the JWT to the user.

const createTokenSend = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.DEV_MODE === 'prod' ? true : false,
  };
  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    data: user,
    token,
  });
};

// The function bellow will update users password if they're logged in

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findOne({ _id: req.user.id }).select('+password');
  // Check if posted current password is correct
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!user.checkPassword(oldPassword, user.password))
    return next(new AppError('Incorrect password please try again.'), 401);
  // if so update password and log the user in using a new token.
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();
  createTokenSend(user, 200, res);
});

// The function bellow will contain the functionality for resting the reset password token.

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('Incorrect Email: No user registered with this email', 404));
  try {
    // Generate the random token
    const passwordToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // Send it to user's email
    const resetLink = `${req.protocol}//${req.hostname}/resetPassword/${passwordToken}`;
    const message = `You can reset your password using the link below:\n${resetLink}`;
    sendMail({
      email: user.email,
      subject: 'Password reset token (valid for 10 mins)',
      message: message,
    });
    res.status(200).json({
      status: 'Success',
      message: 'Please check your inbox.',
    });
  } catch (e) {
    res.status(500).json({
      status: 'Failure',
      message: 'Token not sent please try again.',
    });
  }
});

// The function bellow will be able to reset the user password using the token provided from the url

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user)
    return next(new AppError('Token invalid or expired please try again later.', 404));
  // If token has not expired and there is user set the new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // Update changedPasswordAt property for the user (Done in the user model using document middlware)
  // Generate token and login
  createTokenSend(user, 200, res);
});

// The function bellow will be responsible for restricting access to a specific type of users.
exports.restrictAt = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          'Unauthorized: Only a certain type of users can perform this action.',
          403
        )
      );
    next();
  };
};

// The function bellow will be responsible for protecting route from unautorized user.
exports.protectRoute = catchAsync(async (req, res, next) => {
  // Check if the token exits
  let token;
  if (!req.headers.authorization && !req.cookies.jwt)
    return next(
      new AppError('Autorization token is unavailable please login again', 401)
    );
  // Check if the token is valid
  if (req.headers.authorization) token = req.headers.authorization.split(' ')[1];
  else if (req.cookies.jwt) token = req.cookies.jwt;
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET).catch(() => {
    return next(
      new AppError('Autorization token is invalid or modified please login again', 401)
    );
  });
  // Check if the user associated with the token still exits
  const currentUser = await User.findOne({ _id: decoded.id });
  if (!currentUser)
    return next(
      new AppError('The user associated with this token has been deleted.', 401)
    );
  // Check if the password has not been changed after the token has been issued
  if (currentUser.changedPwd(decoded.iat)) {
    return next(new AppError('Password has been changed please login again.', 401));
  }
  req.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // Check if the token exits
  if (req.cookies.jwt) {
    const token = req.cookies.jwt;
    // Check if the token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET).catch(
      () => {
        return next();
      }
    );
    // Check if the user associated with the token still exits
    let currentUser;
    if (decoded) currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();
    // Check if the password has not been changed after the token has been issued
    if (currentUser.changedPwd(decoded.iat)) {
      return next();
    }
    res.locals.user = currentUser;
    return next();
  }
  next();
});

// The function bellow contains code that will create a new user.
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
    role,
  });
  createTokenSend(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Check if username and password have been entered.
  const { email, password } = req.body;
  if (!(email && password))
    return next(new AppError('Please enter you email and password', 400));
  // Check if email exists and password is correct.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // if everything checks out generate a token and send it to the user
  createTokenSend(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  res.cookie('jwt', 'DISCONNECTED', cookieOptions);
  res.status(200).json({
    status: 'Success',
  });
  //
});
