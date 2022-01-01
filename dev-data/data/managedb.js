const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({
  path: './../../config.env',
});

const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

const db = process.env.DATABASE.replace('%pw%', process.env.DATABASE_PASSWORD);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

const loadData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users);
    await Review.create(reviews);
  } catch (e) {
    console.log(e);
  }
  console.log('Data Loaded Into The Database Succesfully.');
  process.exit(1);
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
  } catch (e) {
    console.log(e);
  }
  console.log('Data Deleted From The Database Succesfully.');
  process.exit(1);
};

if (process.argv[2] === '--import') {
  loadData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

mongoose.connect(db, options).then(() => {
  console.log('Connection established succesfully :)');
});
