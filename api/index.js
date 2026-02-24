const { app, connectDB } = require('../server/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  return app(req, res);
};
