const AppError = require('../utils/AppError');
const CatchAsync = require('../utils/CatchAsync');
const APIFeatures = require('../utils/ApiFeatures');

exports.getAll = (Model) => async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const Features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const docs = await Features.query;
  res.status(200).json({
    status: 'Success',
    results: docs.length,
    data: docs,
  });
};

exports.getOne = (Model, populateOption) => async (req, res, next) => {
  let query = Model.findById(req.params.id);
  if (populateOption) query = query.populate(populateOption);
  const doc = await query;
  if (!doc) {
    return next(new AppError('Document not found or deleted.', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: doc,
  });
};

exports.deleteOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('Document not found or deleted.', 404));
    }
    res.status(204).json({
      status: 'Success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(200).json({
      status: 'Success',
      data: doc,
    });
  });

exports.updateOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('Document not found or deleted.', 404));
    }
    res.status(200).json({
      status: 'Success',
      data: doc,
    });
  });
