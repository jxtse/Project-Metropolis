export const validateLocation = (req, res, next) => {
  const location = req.body?.location || req.query?.location;
  
  if (location && typeof location === 'string') {
    if (location.length < 2) {
      return res.status(400).json({
        error: 'Location must be at least 2 characters long',
        code: 'INVALID_LOCATION'
      });
    }
    
    if (location.length > 200) {
      return res.status(400).json({
        error: 'Location must not exceed 200 characters',
        code: 'INVALID_LOCATION'
      });
    }
  }
  
  next();
};

export const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (sessionId && !uuidRegex.test(sessionId)) {
    return res.status(400).json({
      error: 'Invalid session ID format',
      code: 'INVALID_SESSION_ID'
    });
  }
  
  next();
};

export const rateLimiter = () => {
  const requests = new Map();
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '10');
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '60000');
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }
    
    const clientRequests = requests.get(clientId);
    const recentRequests = clientRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }
    
    recentRequests.push(now);
    requests.set(clientId, recentRequests);
    
    next();
  };
};