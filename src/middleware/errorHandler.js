export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.message?.includes('Invalid instruction')) {
    return res.status(422).json({
      error: 'Generated instruction failed validation',
      code: 'INVALID_INSTRUCTION',
      details: err.message
    });
  }

  if (err.message?.includes('Failed to generate instruction')) {
    return res.status(503).json({
      error: 'LLM service temporarily unavailable',
      code: 'LLM_SERVICE_ERROR',
      details: err.message
    });
  }

  if (err.message?.includes('Session') && err.message?.includes('not found')) {
    return res.status(404).json({
      error: 'Session not found',
      code: 'SESSION_NOT_FOUND'
    });
  }

  if (err.status === 401) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};