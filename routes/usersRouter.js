const express = require('express');
const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

const Router = express.Router();

// Special route for signing up users

Router.post('/signup', authController.signup);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);

// These routes will be responsible for managing users password

Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

Router.use(authController.protectRoute);

Router.patch('/updatePassword', authController.updatePassword);

Router.get('/me', usersController.getMe, usersController.getUser);
Router.patch('/updateMe', usersController.updateMe);
Router.delete('/deleteMe', usersController.deleteMe);

// This route will be used for admins.

Router.route('/').get(usersController.getUsers).post(usersController.createUser);

Router.route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = Router;
