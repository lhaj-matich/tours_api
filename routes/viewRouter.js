const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const Router = express.Router();

Router.use(authController.isLoggedIn);

Router.get('/', viewController.getOverview);

Router.get('/tour/:slug', viewController.viewTour);

Router.get('/login', viewController.logIn);

module.exports = Router;
