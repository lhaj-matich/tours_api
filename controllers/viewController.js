const Tour = require('../models/tourModel');
const CatchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

exports.getOverview = CatchAsync(async (req, res, next) => {
  // 1 Get all tours
  const tours = await Tour.find();
  // 2 Render the page using the data from the tour model
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.viewTour = CatchAsync(async (req, res, next) => {
  // Query for the data using the slug param.
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour)
    next(
      new AppError(
        'Incorrect param please visit the home page and select one of the tours.',
        404
      )
    );
  // Render the page using the data from the tour model.
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.logIn = CatchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('login', {
      title: 'Login',
    });
});
