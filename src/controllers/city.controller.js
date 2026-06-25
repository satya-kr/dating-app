const City = require('../models/city.model');

const getStates = async (req, res) => {
  try {
    const states = await City.distinct('state');
    res.json({ states: states.sort() });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCitiesByState = async (req, res) => {
  try {
    const { state } = req.params;
    const cities = await City.find({ state }).select('name').sort({ name: 1 }).lean();
    res.json({ cities: cities.map((c) => c.name) });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchCities = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ cities: [] });
    const cities = await City.find({ name: { $regex: q, $options: 'i' } }).limit(20).lean();
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getStates, getCitiesByState, searchCities };
