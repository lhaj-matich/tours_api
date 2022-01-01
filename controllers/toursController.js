const Tour = require('../models/tourModel');
const handlerFactory = require('./factoryHandler');
const CatchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

// The concept bellow called aliasing.
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,duration,imageCover,price,summary,ratingsAverage';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour);
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getToursWithin = CatchAsync(async (req, res, next) => {
  // Get the params for coordinates and distance and unit of mesure.
  const { distance, coordinates, unit } = req.params;
  // Seperate them in variable named lt lg and unit and distance and create the radius varaible.
  const [lg, lt] = coordinates.split(',');
  const multiplier = unit === 'km' ? 6378 : 3963;
  const radius = distance / multiplier;
  // Check that the params provided are valid and that they exists.
  if (!lg || !lt) return next(new AppError('Please specifiy your coordiates.', 400));
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lt, lg], radius] } },
  });
  res.status(200).json({
    status: 'Success',
    result: tours.length,
    data: tours,
  });
});

exports.getDistances = CatchAsync(async (req, res, next) => {
  // Get the params for coordinates and distance and unit of mesure.
  const { coordinates, unit } = req.params;
  // Seperate them in variable named lt lg and unit and distance and create the radius varaible.
  const [lg, lt] = coordinates.split(',');
  const multiplier = unit === 'km' ? 0.001 : 0.0006;
  // Check that the params provided are valid and that they exists.
  if (!lg || !lt) return next(new AppError('Please specifiy your coordiates.', 400));
  // Build the aggregation stage
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lt * 1, lg * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Success',
    data: distances,
  });
});

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          maxPrice: { $max: '$price' },
          minPrice: { $min: '$price' },
          avgRating: { $avg: '$ratingsAverage' },
          numRatings: { $sum: '$ratingsQuantity' },
        },
      },
      {
        $sort: {
          avgPrice: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'Success',
      data: stats,
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failure',
      data: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          name: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: {
          numTourStarts: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'Success',
      data: plan,
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failure',
      data: err,
    });
  }
};
