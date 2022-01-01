const express = require('express');
const toursController = require('../controllers/toursController');
const authController = require('../controllers/authController');

const reviewsRouter = require('./reviewsRouter');

const Router = express.Router();

// Router.param('id', toursController.checkID);

// /tours/293iw7d/reviews : Nested routes. This is acompelished by calling another router inside a router.

Router.use('/:tourId/reviews', authController.protectRoute, reviewsRouter);

Router.route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictAt('admin', 'lead-guide'),
    toursController.createTour
  );

Router.route('/top-5-cheap').get(
  toursController.aliasTopTours,
  toursController.getAllTours
);

Router.use(authController.protectRoute);

Router.route('/monthly-plan/:year').get(
  authController.restrictAt('admin', 'lead-guide', 'guide'),
  toursController.getMonthlyPlan
);

// /tours-within/300/center/-40,40/unit/km

Router.route('/tours-within/:distance/center/:coordinates/unit/:unit').get(
  toursController.getToursWithin
);

Router.route('/distance/:coordinates/unit/:unit').get(toursController.getDistances);

Router.route('/tours-stats').get(toursController.getTourStats);

Router.route('/:id')
  .get(toursController.getTour)
  .patch(authController.restrictAt('admin', 'lead-guide'), toursController.updateTour)
  .delete(authController.restrictAt('admin', 'lead-guide'), toursController.deleteTour);

module.exports = Router;
