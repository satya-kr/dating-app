require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const City = require('./src/models/city.model');

const seedCities = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    const filePath = path.join(__dirname, 'Indian_Cities_In_States_JSON');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Clear existing cities
    await City.deleteMany({});
    console.log('Cleared existing cities');

    // Build documents
    const cities = [];
    for (const [state, cityNames] of Object.entries(data)) {
      for (const name of cityNames) {
        cities.push({ name, state });
      }
    }

    // Insert all
    await City.insertMany(cities);
    console.log(`Inserted ${cities.length} cities from ${Object.keys(data).length} states`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedCities();
