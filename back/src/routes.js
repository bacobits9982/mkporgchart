import HTTPStatus from 'http-status';
import { APIClientError } from './helpers/APIResponse';
import wrapAsync from './helpers/wrapAsync';

// Routes
import jsonRoutes from './api/json/json.routes';

export default app => {
  // Insert routes below
  app.use('/api', jsonRoutes);

  // Handler for invalid routes
  app.all(
    '*',
    // eslint-disable-next-line
    wrapAsync(async (req, res, next) => {
      throw new APIClientError(
        {
          message: 'Invalid route.',
        },
        HTTPStatus.NOT_FOUND,
        HTTPStatus['404'],
      );
    }),
  );
};
