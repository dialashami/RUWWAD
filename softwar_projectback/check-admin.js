const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
console.log('URI exists:', !!MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = require('./models/user_model');
    const admin = await User.findOne({ email: 'aboodjamal684@gmail.com' });
    
    if (admin) {
      console.log('✅ Admin user exists!');
      console.log('Admin ID:', admin._id.toString());
      console.log('Admin role:', admin.role);
    } else {
      console.log('❌ No admin user found with email aboodjamal684@gmail.com');
      console.log('Creating admin user...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('abood123456789', 10);
      
      const newAdmin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'aboodjamal684@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('✅ Created admin user with ID:', newAdmin._id.toString());
    }
    
    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
