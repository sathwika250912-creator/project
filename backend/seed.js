const connectDB = require('./config/db');
const mongoose = require('mongoose');

// Simple Ticket schema for seeding example data
const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

async function seed() {
  await connectDB();

  try {
    // Clear existing tickets (only for dev)
    await Ticket.deleteMany({});

    const samples = [
      { title: 'Login not working', description: 'User cannot login with correct credentials' },
      { title: 'Page crash on submit', description: 'App crashes when submitting ticket form' },
      { title: 'UI glitch on mobile', description: 'Layout breaks on small screens' }
    ];

    const created = await Ticket.insertMany(samples);
    console.log(`Inserted ${created.length} tickets`);
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    // Close mongoose connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Seed complete.');
    process.exit(0);
  }
}

seed();
