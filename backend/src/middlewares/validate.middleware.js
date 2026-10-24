export const validateSchema = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }
  // Usar los datos validados descarta campos no declarados en el esquema
  req.body = result.data;
  next();
};
