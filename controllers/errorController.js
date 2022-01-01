const AppError = require('../utils/AppError');

const ErrorDev = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const ErrorProd = (res, err) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // This will only appear on ther server log.
    console.log('[-] Server Error: ', err);
    // We should send a general response to the client that's why we're using 500 code here.
    res.status(500).json({
      status: 'Failure',
      message: '500: Internal Server Error: system modules crashed',
    });
  }
};

const HandleCastErrorDB = (error) => {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
};

const HandleDuplicateErrorDB = (error) => {
  const value = error.message.match(/"((?:\\.|[^"\\])*)"/)[1];
  const message = `Duplicated value: {${value}} please use another one.`;
  return new AppError(message, 400);
};

const HandleValidationErrorDB = (error) => {
  const message = error.message;
  return new AppError(message, 400);
};

const HandleInvalidToken = () =>
  new AppError('Authorization token is invalid please login again.', 401);

const HandleExpiredToken = () =>
  new AppError('Authorization token is expired please login again.', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Failure';
  if (process.env.DEV_MODE === 'dev') {
    ErrorDev(res, err);
  } else if (process.env.DEV_MODE === 'prod') {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = HandleCastErrorDB(error);
    if (err.code === 11000) error = HandleDuplicateErrorDB(error);
    if (err.name === 'ValidationError') error = HandleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = HandleInvalidToken();
    if (err.name === 'TokenExpiredError') error = HandleExpiredToken();
    ErrorProd(res, error);
  }
};
