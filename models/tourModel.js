const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour Must Have A Name'],
      unique: [true, 'A Tour Must A Unique Name'],
      trim: true,
      maxLength: [40, 'A tour name must be less than 40 characters'],
      minLength: [10, 'A tour name must be greater than 10 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A Tour Must Have A Duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour Difficuly Must Be Set'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy medium difficult',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        'Please insert the maximum number of people who can subscribe to this tour.',
      ],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [0, 'A Tour ratingsAverage Should be greater than 0'],
      max: [5, 'A Tour ratingsAverage Should be less than 5'],
    },
    slug: String,
    summary: {
      type: String,
      required: [true, 'Please insert the summary of this tour.'],
    },
    description: {
      type: String,
      trim: true,
    },
    ratingsQuantity: Number,
    imageCover: String,
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    // These are schema type options
    price: {
      type: Number,
      required: [true, 'A tour Must Have A Price'],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (v) {
          return this.price > v;
        },
        message: 'The discount price should be lower than the price itself.',
      },
    },
    // Mongodb uses a special type called GeoJson in order to specify geo-spacial data
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      // This way we can implement document referencing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// The code bellow is just a way to implement document embedding.

// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map((id) => User.findOne({ _id: id }));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// ! The function bellow might be used in the future.

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`This request took : ${Date.now() - this.start} miliseconds`);
//   next();
// });

// ! The middleware bellow was disabled only for geoNear aggregation stage because it only requires on stage in the pipeline.

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
//   ? console.log(this.pipeline()); // This for logging the aggregation pipeline
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
