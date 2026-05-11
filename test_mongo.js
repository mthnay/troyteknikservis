import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/mthnay/Yazılımlar/mobile-asp/.env' });

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function test() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected');
    
    // Check if Repair model has internalNotes saved
    const Repair = mongoose.model('Repair', new mongoose.Schema({}, { strict: false }));
    const latestRepairs = await Repair.find().sort({_id: -1}).limit(5);
    
    latestRepairs.forEach(r => {
        console.log(`ID: ${r.id}, internalNotes: ${JSON.stringify(r.internalNotes) || 'undefined'}`);
    });
    
    process.exit(0);
}

test();
