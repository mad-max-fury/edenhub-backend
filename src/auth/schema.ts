import Joi from 'joi';
import { Header } from '../core/utils';
import { JoiAuthBearer } from '../helpers/validator';

export default {
  auth: Joi.object()
    .keys({
      authorization: JoiAuthBearer().required(),
    })
    .unknown(true),
};
