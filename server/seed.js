const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Utility = require('./models/Utility');
const Organization = require('./models/Organization');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Utility.deleteMany({});
    await Organization.deleteMany({});

    // 1. Create superadmin (no org)
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@utility.com',
      password: 'super123',
      role: 'superadmin',
      flatNumber: 'HQ',
      trustScore: 100
    });
    console.log('Superadmin created: superadmin@utility.com / super123');

    // 2. Create a demo organization
    const org = await Organization.create({
      name: 'Sunrise Apartments',
      type: 'society',
      address: '42 MG Road, Bangalore',
      createdBy: superadmin._id
    });
    console.log(`Organization created: ${org.name} (${org._id})`);

    // 3. Create org_admin users
    await User.create([
      { name: 'Admin One', email: 'admin@utility.com', password: 'admin123', role: 'org_admin', flatNumber: 'OFFICE-1', trustScore: 100, organizationId: org._id },
      { name: 'Admin Two', email: 'admin2@utility.com', password: 'admin123', role: 'org_admin', flatNumber: 'OFFICE-2', trustScore: 100, organizationId: org._id },
    ]);
    console.log('Org admin users created');

    // 4. Create member users
    await User.create([
      { name: 'Rahul Sharma', email: 'rahul@test.com', password: 'test123', role: 'member', flatNumber: 'A-101', trustScore: 95, organizationId: org._id },
    ]);
    console.log('Member users created');

    // 5. Create utilities scoped to org
    await Utility.create([
      {
        name: 'Parking Slot A',
        type: 'parking',
        description: 'Covered parking slot in Block A basement',
        pricePerHour: 20,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        cooldownHours: 1,
        organizationId: org._id
      },
      {
        name: 'Community Hall',
        type: 'community_hall',
        description: 'Large hall for events, meetings, and celebrations. Capacity: 100 people',
        pricePerHour: 500,
        maxHoursPerDay: 6,
        maxHoursPerWeek: 12,
        cooldownHours: 24,
        organizationId: org._id
      },
      {
        name: 'Backup Generator',
        type: 'generator',
        description: 'Diesel generator for power backup during outages',
        pricePerHour: 150,
        maxHoursPerDay: 4,
        maxHoursPerWeek: 16,
        cooldownHours: 2,
        organizationId: org._id
      },
      {
        name: 'EV Charging Station',
        type: 'ev_charger',
        description: 'Level 2 EV charger, 7.2kW output',
        pricePerHour: 50,
        maxHoursPerDay: 3,
        maxHoursPerWeek: 10,
        cooldownHours: 4,
        organizationId: org._id
      },
      {
        name: 'Water Tanker (5000L)',
        type: 'water_tanker',
        description: 'Reserve a water tanker delivery for your flat',
        pricePerHour: 200,
        maxHoursPerDay: 1,
        maxHoursPerWeek: 3,
        cooldownHours: 48,
        organizationId: org._id
      },
    ]);
    console.log('Utilities created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Superadmin : superadmin@utility.com / super123');
    console.log('  Org Admin  : admin@utility.com / admin123');
    console.log('  Org Admin  : admin2@utility.com / admin123');
    console.log('  Member     : rahul@test.com / test123');
    console.log(`\nOrganization: ${org.name} (${org._id})`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
