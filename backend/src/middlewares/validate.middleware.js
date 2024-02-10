export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors[0].message) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(400).json({ error: error.errors });
    }
  }
};
