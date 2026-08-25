require('dotenv').config();
const mongoose = require('mongoose');
const LocalHub = require('./models/LocalHub');

const HUBS = [
  { name: 'District Hub Koramangala', area: 'Koramangala', city: 'Bangalore',  address: '5th Block, Koramangala, Bengaluru 560034' },
  { name: 'District Hub Bandra',      area: 'Bandra West',  city: 'Mumbai',     address: 'Hill Road, Bandra West, Mumbai 400050'     },
  { name: 'District Hub CP',          area: 'Connaught Place', city: 'Delhi',   address: 'Block A, Connaught Place, New Delhi 110001' },
  { name: 'District Hub T Nagar',     area: 'T Nagar',     city: 'Chennai',    address: 'Pondy Bazaar, T Nagar, Chennai 600017'     },
  { name: 'District Hub Hitech City', area: 'Hitech City', city: 'Hyderabad',  address: 'Madhapur, Hitech City, Hyderabad 500081'   },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  let added = 0, skipped = 0;
  for (const h of HUBS) {
    const exists = await LocalHub.findOne({ name: h.name });
    if (exists) { skipped++; continue; }
    await LocalHub.create(h);
    console.log(`  + ${h.name}`);
    added++;
  }

  console.log(`\nHub seed complete — ${added} added, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
