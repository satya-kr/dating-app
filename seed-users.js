require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

const DUMMY_IMAGE = '/uploads/1782414750994-107815003.jpg';

const dummyUsers = [
  { name: 'Priya Sharma', email: 'priya@test.com', phone: '9876543210', gender: 'female', interestedIn: 'male', lookingFor: 'date', city: 'Kolkata', state: 'West Bengal', bio: 'Love travelling and exploring new places. Always up for an adventure and meeting interesting people around the world.', interests: ['Travel', 'Music', 'Photography'] },
  { name: 'Rahul Verma', email: 'rahul@test.com', phone: '9876543211', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Mumbai', state: 'Maharashtra', bio: 'Software engineer by day, guitarist by night. Looking for someone who shares my passion for music and good food.', interests: ['Music', 'Tech', 'Food'] },
  { name: 'Ananya Das', email: 'ananya@test.com', phone: '9876543212', gender: 'female', interestedIn: 'male', lookingFor: 'friend', city: 'Bengaluru', state: 'Karnataka', bio: 'Bookworm and fitness enthusiast. I believe life is about balance between the mind and body. Let us connect!', interests: ['Reading', 'Fitness', 'Yoga'] },
  { name: 'Vikram Singh', email: 'vikram@test.com', phone: '9876543213', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Delhi', state: 'Delhi', bio: 'Passionate about sports and outdoor activities. Weekend hiker and cricket fanatic. Looking for my adventure partner forever.', interests: ['Sports', 'Hiking', 'Fitness'] },
  { name: 'Sneha Patel', email: 'sneha@test.com', phone: '9876543214', gender: 'female', interestedIn: 'any', lookingFor: 'not_decided', city: 'Ahmedabad', state: 'Gujarat', bio: 'Creative soul who loves art and cooking. Always experimenting with new recipes and painting styles in my free time.', interests: ['Art', 'Cooking', 'Photography'] },
  { name: 'Arjun Reddy', email: 'arjun@test.com', phone: '9876543215', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Hyderabad', state: 'Telangana', bio: 'Movie buff and aspiring filmmaker. Love discussing cinema and storytelling. Always watching something new on weekends and nights.', interests: ['Movies', 'Art', 'Tech'] },
  { name: 'Meera Nair', email: 'meera@test.com', phone: '9876543216', gender: 'female', interestedIn: 'male', lookingFor: 'friend', city: 'Kochi', state: 'Kerala', bio: 'Dancer and yoga practitioner. Believe in mindful living and spreading positivity everywhere. Life is beautiful and short.', interests: ['Dancing', 'Yoga', 'Music'] },
  { name: 'Karan Mehta', email: 'karan@test.com', phone: '9876543217', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Pune', state: 'Maharashtra', bio: 'Gaming enthusiast and tech nerd. Building cool stuff during the day and playing online games at night with friends.', interests: ['Gaming', 'Tech', 'Movies'] },
  { name: 'Riya Joshi', email: 'riya@test.com', phone: '9876543218', gender: 'female', interestedIn: 'male', lookingFor: 'date', city: 'Jaipur', state: 'Rajasthan', bio: 'Fashion lover and travel addict. My Instagram is basically a travel diary. Looking for someone to explore the world with.', interests: ['Travel', 'Photography', 'Dancing'] },
  { name: 'Aditya Kumar', email: 'aditya@test.com', phone: '9876543219', gender: 'male', interestedIn: 'female', lookingFor: 'not_decided', city: 'Chennai', state: 'Tamil Nadu', bio: 'Foodie and fitness freak at the same time. Love discovering local cuisines and then burning it off at the gym next day.', interests: ['Food', 'Fitness', 'Sports'] },
  { name: 'Nisha Gupta', email: 'nisha@test.com', phone: '9876543220', gender: 'female', interestedIn: 'any', lookingFor: 'friend', city: 'Lucknow', state: 'Uttar Pradesh', bio: 'Teacher by profession and learner by heart. Love reading books and having deep conversations about life and philosophy.', interests: ['Reading', 'Music', 'Cooking'] },
  { name: 'Rohan Chatterjee', email: 'rohan@test.com', phone: '9876543221', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Kolkata', state: 'West Bengal', bio: 'Photographer and traveler. Capturing moments one click at a time. The world is beautiful when seen through a lens.', interests: ['Photography', 'Travel', 'Art'] },
  { name: 'Pooja Rani', email: 'pooja@test.com', phone: '9876543222', gender: 'female', interestedIn: 'male', lookingFor: 'date', city: 'Patna', state: 'Bihar', bio: 'Simple girl with big dreams. Love cooking traditional food and listening to old Bollywood songs on a rainy evening always.', interests: ['Cooking', 'Music', 'Movies'] },
  { name: 'Deepak Yadav', email: 'deepak@test.com', phone: '9876543223', gender: 'male', interestedIn: 'female', lookingFor: 'friend', city: 'Indore', state: 'Madhya Pradesh', bio: 'Startup founder and coffee addict. Always brainstorming ideas and looking for like-minded people who want to change the world.', interests: ['Tech', 'Reading', 'Food'] },
  { name: 'Kavya Menon', email: 'kavya@test.com', phone: '9876543224', gender: 'female', interestedIn: 'male', lookingFor: 'date', city: 'Thiruvananthapuram', state: 'Kerala', bio: 'Classical dancer turned modern artist. I express myself through movement and colors. Art is my language and love.', interests: ['Dancing', 'Art', 'Yoga'] },
  { name: 'Sameer Khan', email: 'sameer@test.com', phone: '9876543225', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Guwahati', state: 'Assam', bio: 'Nature lover and trekker. The mountains call me every weekend. Looking for a hiking buddy to explore the northeast together.', interests: ['Hiking', 'Photography', 'Travel'] },
  { name: 'Tanvi Deshmukh', email: 'tanvi@test.com', phone: '9876543226', gender: 'female', interestedIn: 'male', lookingFor: 'not_decided', city: 'Nagpur', state: 'Maharashtra', bio: 'Medical student who loves music and gaming in spare time. Life is about finding joy in small moments between studies.', interests: ['Music', 'Gaming', 'Reading'] },
  { name: 'Ishaan Malhotra', email: 'ishaan@test.com', phone: '9876543227', gender: 'male', interestedIn: 'female', lookingFor: 'date', city: 'Chandigarh', state: 'Chandigarh', bio: 'Fitness coach and nutrition enthusiast. Helping people transform their lives one workout at a time. Strong body strong mind.', interests: ['Fitness', 'Food', 'Sports'] },
  { name: 'Simran Kaur', email: 'simran@test.com', phone: '9876543228', gender: 'female', interestedIn: 'male', lookingFor: 'date', city: 'Amritsar', state: 'Punjab', bio: 'Foodie who loves to cook and explore different cuisines. Life is too short for bad food. Let us eat well together.', interests: ['Cooking', 'Food', 'Travel'] },
  { name: 'Aman Tiwari', email: 'aman@test.com', phone: '9876543229', gender: 'male', interestedIn: 'female', lookingFor: 'friend', city: 'Varanasi', state: 'Uttar Pradesh', bio: 'Musician and spiritual seeker. Finding peace through music and meditation by the ghats. Life is a beautiful journey always.', interests: ['Music', 'Yoga', 'Art'] },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Delete all users except test1@gmail.com
    const result = await User.deleteMany({ email: { $ne: 'test1@gmail.com' } });
    console.log(`Deleted ${result.deletedCount} users (kept test1@gmail.com)`);

    // Hash password once
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Create users
    const users = dummyUsers.map((u) => ({
      ...u,
      password: hashedPassword,
      isProfileCompleted: true,
      images: [DUMMY_IMAGE],
      profileLikes: Math.floor(Math.random() * 15),
      messageLikes: Math.floor(Math.random() * 10),
      status: 'active',
      isDeactivated: false,
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      profileCompleteness: 90,
    }));

    await User.insertMany(users);
    console.log(`Inserted ${users.length} dummy users`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
