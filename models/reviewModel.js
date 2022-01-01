const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review is required!'],
    },
    rating: {
      type: Number,
      max: [5, 'Rating can only be less than 5'],
      min: [1, 'Rating should be at least 1'],
      default: 4.5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index so that the user can make only one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.updateRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        ratingsNum: { $sum: 1 },
        ratingsAvg: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(
      { _id: tourId },
      { ratingsQuantity: stats[0].ratingsNum, ratingsAverage: stats[0].ratingsAvg }
    );
  } else {
    await Tour.findByIdAndUpdate(
      { _id: tourId },
      { ratingsQuantity: 0, ratingsAverage: 4.5 }
    );
  }
};

reviewSchema.post('save', function (doc) {
  this.constructor.updateRatings(doc.tour);
});

// We used findOneAnd so we can cover both findByIdAndUpdate and FindByIdAndDelete.

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.updateRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
