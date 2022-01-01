const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

// mergeParams will preserve the params from the parent router
const Router = express.Router({ mergeParams: true });

Router.route('/')
  .get(reviewsController.getAllReviews)
  .post(
    authController.protectRoute,
    authController.restrictAt('user'),
    reviewsController.setTourUser,
    reviewsController.createReview
  );

Router.use(authController.protectRoute);

Router.route('/:id')
  .delete(
    authController.restrictAt('admin', 'lead-guide'),
    reviewsController.deleteReview
  )
  .patch(authController.restrictAt('user', 'admin'), reviewsController.updateReview)
  .get(reviewsController.getReview);

module.exports = Router;
