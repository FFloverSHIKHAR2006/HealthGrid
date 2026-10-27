import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/** validate({ body, params, query }) - replaces each with the parsed (and stripped) value. */
export const validate = (schemas) => (req, res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key]);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const idParam = z.object({ id: objectId });
