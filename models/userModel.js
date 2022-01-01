const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please insert your name.'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please insert your email address.'],
    validate: {
      validator: validator.isEmail,
      message: 'Please insert a valid email address.',
    },
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please enter a password.'],
    min: [8, 'Password requires a minimum of 8 characters.'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm you password.'],
    min: [8, 'Password requires a minimum of 8 characters.'],
    validate: {
      validator: function (v) {
        return v === this.password;
      },
      message: 'Unable to confirm password.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

//! This should not be commented in production mode am only using it in dev mode

userSchema.pre('save', function (next) {
  if (this.isModified('password') && this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // Use this pre save hook only if the password is inserted.
  if (!this.isModified('password')) return next();
  // Hash the password using salt cost of 12.
  this.password = await bcrypt.hash(this.password, 12);
  // Make sure that the password fields is not inserted in the database.
  this.confirmPassword = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword, userPassword) {
  // This function will compare the user password with the password which was provided to the API.
  const result = await bcrypt.compare(candidatePassword, userPassword);
  return result;
};

userSchema.methods.changedPwd = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // The token will be valid only for 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
