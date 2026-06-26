require('dotenv').config({
  path: './.env'
});
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

const users = [
  { name: 'Arjun Sharma', email: 'arjun@test.com', phone: '9876543210', password: '00000000', gender: 'male' },
  { name: 'Priya Patel', email: 'priya@test.com', phone: '9876543211', password: '00000000', gender: 'female' },
  { name: 'Rahul Verma', email: 'rahul@test.com', phone: '9876543212', password: '00000000', gender: 'male' },
  { name: 'Sneha Gupta', email: 'sneha@test.com', phone: '9876543213', password: '00000000', gender: 'female' },
  { name: 'Vikram Singh', email: 'vikram@test.com', phone: '9876543214', password: '00000000', gender: 'male' },
  { name: 'Ananya Roy', email: 'ananya@test.com', phone: '9876543215', password: '00000000', gender: 'female' },
  { name: 'Karan Mehta', email: 'karan@test.com', phone: '9876543216', password: '00000000', gender: 'male' },
  { name: 'Divya Nair', email: 'divya@test.com', phone: '9876543217', password: '00000000', gender: 'female' },
  { name: 'Amit Kumar', email: 'amit@test.com', phone: '9876543218', password: '00000000', gender: 'male' },
  { name: 'Riya Joshi', email: 'riya@test.com', phone: '9876543219', password: '00000000', gender: 'female' },
];

// const seed = async () => {
//   try {
//     console.log(process.env.DATABASE_URL);
//     await mongoose.connect(process.env.DATABASE_URL);
//     console.log('Connected to DB');

//     for (const u of users) {
//       const exists = await User.findOne({ email: u.email });
//       if (exists) {
//         console.log(`Skipped (exists): ${u.name}`);
//         continue;
//       }
//       await User.create(u);
//       console.log(`Created: ${u.name}`);
//     }

//     console.log('\nDone! All users have password: 00000000');
//     process.exit(0);
//   } catch (error) {
//     console.error('Seed failed:', error.message);
//     process.exit(1);
//   }
// };

// seed();


const updateWallet = async () => {
  try {
    console.log(process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to DB');

    const result = await User.updateMany(
      {}, // Update all users
      {
        $set: {
          wallet: 100,
        },
      }
    );

    console.log(`Matched: ${result.matchedCount} users`);
    console.log(`Modified: ${result.modifiedCount} users`);

    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
};

updateWallet();