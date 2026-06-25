const { Router } = require('express');
const { getStates, getCitiesByState, searchCities } = require('../controllers/city.controller');

const router = Router();

router.get('/states', getStates);
router.get('/cities/:state', getCitiesByState);
router.get('/search', searchCities);

module.exports = router;
