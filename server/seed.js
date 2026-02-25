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

    // 2. Create 5 demo organizations
    const orgConfigs = [
      { name: 'Sunrise Apartments', type: 'society', address: '42 MG Road, Bangalore', adminEmail: 'admin@test.com', adminName: 'Admin User' },
      { name: 'Green Valley Residency', type: 'society', address: '11 Residency Road, Bangalore', adminEmail: 'admin2@test.com', adminName: 'Admin Two' },
      { name: 'Skyline Towers', type: 'society', address: '88 Airport Road, Bangalore', adminEmail: 'admin3@test.com', adminName: 'Admin Three' },
      { name: 'TechPark Commons', type: 'company', address: '11 Whitefield Main Rd, Bangalore', adminEmail: 'admin4@test.com', adminName: 'Admin Four' },
      { name: 'Lakeside Campus', type: 'college', address: '77 Ring Road, Bangalore', adminEmail: 'admin5@test.com', adminName: 'Admin Five' }
    ];

    const organizations = [];
    for (const cfg of orgConfigs) {
      const org = await Organization.create({
        name: cfg.name,
        type: cfg.type,
        address: cfg.address,
        createdBy: superadmin._id
      });

      const admin = await User.create({
        name: cfg.adminName,
        email: cfg.adminEmail,
        password: 'admin123',
        role: 'org_admin',
        flatNumber: 'OFFICE-1',
        trustScore: 100,
        organizationId: org._id
      });

      org.createdBy = admin._id;
      org.memberCount = 1;
      await org.save();

      organizations.push(org);
      console.log(`Organization created: ${org.name} | orgId: ${org.organizationCode} | admin: ${cfg.adminEmail}`);
    }

    // 3. Create member test user in first organization
    await User.create({
      name: 'Member User',
      email: 'member@test.com',
      password: 'member123',
      role: 'member',
      flatNumber: 'A-101',
      trustScore: 95,
      organizationId: organizations[0]._id
    });

    organizations[0].memberCount = 2;
    await organizations[0].save();

    // 4. Create utilities scoped to first org
    await Utility.create([
      {
        name: 'Parking Slot A',
        type: 'parking',
        description: 'Covered parking slot in Block A basement',
        pricePerHour: 20,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        cooldownHours: 1,
        organizationId: organizations[0]._id
      },
      {
        name: 'Community Hall',
        type: 'community_hall',
        description: 'Large hall for events, meetings, and celebrations. Capacity: 100 people',
        pricePerHour: 500,
        maxHoursPerDay: 6,
        maxHoursPerWeek: 12,
        cooldownHours: 24,
        organizationId: organizations[0]._id
      },
      {
        name: 'Backup Generator',
        type: 'generator',
        description: 'Diesel generator for power backup during outages',
        pricePerHour: 150,
        maxHoursPerDay: 4,
        maxHoursPerWeek: 16,
        cooldownHours: 2,
        organizationId: organizations[0]._id
      },
      {
        name: 'EV Charging Station',
        type: 'ev_charger',
        description: 'Level 2 EV charger, 7.2kW output',
        pricePerHour: 50,
        maxHoursPerDay: 3,
        maxHoursPerWeek: 10,
        cooldownHours: 4,
        organizationId: organizations[0]._id
      },
      {
        name: 'Water Tanker (5000L)',
        type: 'water_tanker',
        description: 'Reserve a water tanker delivery for your flat',
        pricePerHour: 200,
        maxHoursPerDay: 1,
        maxHoursPerWeek: 3,
        cooldownHours: 48,
        organizationId: organizations[0]._id
      },
    ]);
    console.log('Utilities created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Superadmin : superadmin@utility.com / super123');
    console.log('  Org Admin  : admin@test.com / admin123');
    console.log('  Org Admin  : admin2@test.com / admin123');
    console.log('  Org Admin  : admin3@test.com / admin123');
    console.log('  Org Admin  : admin4@test.com / admin123');
    console.log('  Org Admin  : admin5@test.com / admin123');
    console.log('  Member     : member@test.com / member123');
    console.log('\nOrganizations (searchable orgId):');
    organizations.forEach((o, i) => {
      console.log(`  ${i + 1}. ${o.name} -> ${o.organizationCode}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
