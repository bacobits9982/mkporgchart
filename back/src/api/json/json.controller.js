import expressValidation from 'express-validation';
import models from '../../models';
import { APISuccess, APIClientError } from '../../helpers/APIResponse';

const Circle = models.circle;
const Role = models.role;

export const getAll = async (req, res) => {
  try {
    const circles = await Circle.findAll();
    const roles = await Role.findAll();

    const response = new APISuccess({
      circles,
      roles,
    });

    res.send(response.jsonify());
  } catch (err) {
    if (
      !(
        err instanceof APIClientError ||
        err instanceof expressValidation.ValidationError
      )
    ) {
      throw new Error(err);
    } else {
      throw err;
    }
  }
};

export const get = async (req, res) => {
  res.send();
};
