import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // Accept JWT from httpOnly cookie or Authorization header (fallback)
  const token =
    req.cookies?.sc_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
