import express from 'express';
import cors from 'cors';
import debug from 'debug';
import bodyParser from 'body-parser';
import expressValidation from 'express-validation';
import { APIClientError } from './helpers/APIResponse';
import models from './models';

const app = express();
const log = debug('app'); // eslint-disable-line

// Load middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// initialize sequelize
models.sequelize
  .authenticate()
  .then(() => {
    log('Connected to the database');
  })
  .catch(err => {
    log('Unable to connect to the database: ', err);
  });
if (process.env.NODE_ENV === 'development') {
  models.sequelize.sync({ force: false });
}

// Load the routes
require('./routes').default(app);

// Handle ValidationError
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    return res.status(err.status).json(err);
  }

  return next(err);
});

// Handle APIClientError
app.use((err, req, res, next) => {
  if (err instanceof APIClientError) {
    return res.status(err.status).json(err.jsonify());
  }

  return next(err);
});

export default app;
