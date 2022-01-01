const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (error) => {
  console.log(`${error.name} : ${error.message}`);
  process.exit(1);
});

dotenv.config({
  path: './config.env',
});

const app = require('./app');

const port = process.env.PORT || 3000;
const db = process.env.DATABASE.replace('%pw%', process.env.DATABASE_PASSWORD);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

const server = app.listen(port, () => {
  console.log(`[+] Application started on port: ${port}.`);
});

mongoose.connect(db, options).then(() => {
  console.log('[+] Connection established succesfully.');
  console.log('[+] Developement Env:', process.env.DEV_MODE);
});

process.on('unhandledRejection', (error) => {
  console.log(`${error.name} : ${error.message}`);
  server.close(() => {
    process.exit(1);
  });
});
