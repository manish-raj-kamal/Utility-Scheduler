const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Utility = require('./models/Utility');
const Organization = require('./models/Organization');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const UsageLog = require('./models/UsageLog');
const AuditLog = require('./models/AuditLog');
const JoinRequest = require('./models/JoinRequest');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (full reset)
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    await Payment.deleteMany({});
    await UsageLog.deleteMany({});
    await AuditLog.deleteMany({});
    await JoinRequest.deleteMany({});
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

    // 3. Create org_admin + member test users (exactly 3 total test IDs including superadmin)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'org_admin',
      flatNumber: 'OFFICE-1',
      trustScore: 100,
      organizationId: org._id
    });

    const member = await User.create({
      name: 'Member User',
      email: 'member@test.com',
      password: 'member123',
      role: 'member',
      flatNumber: 'A-101',
      trustScore: 95,
      organizationId: org._id
    });

    org.createdBy = admin._id;
    org.memberCount = 2;
    await org.save();

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
    console.log('  Org Admin  : admin@test.com / admin123');
    console.log('  Member     : member@test.com / member123');
    console.log(`\nOrganization: ${org.name} (${org._id})`);
    console.log(`Organization ID (search/join): ${org.organizationCode}`);
    console.log(`Join Key (org_admin can regenerate): ${org.joinKey}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
