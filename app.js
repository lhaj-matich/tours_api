// Express framework and loggin middlware
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// Security headers and data santazation
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
// Routers
const toursRouter = require('./routes/toursRouter');
const usersRouter = require('./routes/usersRouter');
const reviewsRouter = require('./routes/reviewsRouter');
const viewRouter = require('./routes/viewRouter');
// Error Handling
const AppError = require('./utils/AppError');
const ErrorHandler = require('./controllers/errorController');

const app = express();

if (process.env.DEV_MODE === 'dev') {
  app.use(morgan('dev'));
}

// This middleware will help serve static files
app.use(express.static(path.join(__dirname, 'public')));

// This will set the templating engine as pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

// This middleware will set secure http headers
app.use(helmet());
// This middleware will enable rate limiting which will protect the application for brute force attacks
app.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
  })
);
// This middlware will parse cookies data and make it availble for the application.
app.use(cookieParser());
// This middleware will parse the body data and setting the limit to 10 kb should help protect against DDOS attacks
app.use(express.json({ limit: '10kb' }));
// This middleware should protect against xss attacks
app.use(xss());
// This middleware will prevent route params polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// This middleware should sanitize the data and protect against no-sql query injection
app.use(mongoSanitize());

// This is just a testing middlware made to checkout diffrent stuff in the applicatoin.

app.use((req, res, next) => {
  next();
});

// The concept used here is called routes mounting.
app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
// The code bellow should be able to handle incorrect routes.
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Error 404 Not Found: http://{HOST}${req.originalUrl} does not exist on this server`,
      400
    )
  );
});

app.use(ErrorHandler);

module.exports = app;

// newTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
