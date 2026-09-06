import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ [SECURITY WARNING]: JWT_SECRET environment variable is not set in production. Using fallback secret.');
    }
    return 'streakkeeper-super-secret-jwt-key-2026';
  }
  return secret;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || !decoded.id || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
