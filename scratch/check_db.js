import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/troy-service';

const repairSchema = new mongoose.Schema({}, { strict: false });
const Repair = mongoose.model('Repair', repairSchema, 'repairs');

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const lastRepairs = await Repair.find().sort({ createdAt: -1 }).limit(3);
        console.log('Last 3 Repairs:');
        lastRepairs.forEach(r => {
            console.log(`ID: ${r.id}, Customer: ${r.customer}, TC: ${r.tcNo}, Address: ${r.customerAddress}`);
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
