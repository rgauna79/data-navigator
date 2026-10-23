const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Protección CSRF basada en el header Origin.
// La cookie de sesión usa sameSite "none" en producción, así que el navegador
// la envía también en peticiones iniciadas desde otros sitios. Los navegadores
// siempre incluyen Origin en peticiones cross-site que modifican estado, por lo
// que basta con rechazar las que no vengan del frontend o del propio servidor.
export const csrfProtection = (allowedOrigins) => (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  // Clientes que no son navegadores (curl, tests) no envían Origin
  if (!origin) return next();

  const sameHost = `${req.protocol}://${req.get("host")}`;
  if (origin === sameHost || allowedOrigins.includes(origin)) return next();

  return res.status(403).json({ message: "Forbidden: invalid origin" });
};
