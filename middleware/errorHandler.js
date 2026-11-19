const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([key, e]) => [key, e.message])
    );
    return res.status(422).json({ success: false, message: 'Invalid data', errors });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: 'Server error. Please try again later.',
  });
};

module.exports = { notFound, errorHandler };
