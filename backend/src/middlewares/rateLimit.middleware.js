const windowMs = 15 * 60 * 1000; // 15 minutos
const max = 50; // máximo de peticiones por ventana
const hits = new Map();

// Limiter simple en memoria por IP. Suficiente para protección básica
// de rutas sensibles (login/register) sin agregar dependencias.
export const rateLimit = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  entry.count += 1;
  if (entry.count > max) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  }

  next();
};
