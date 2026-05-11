import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Technician from './models/Technician.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile-asp';

const deleteTechnicians = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const result = await Technician.deleteMany({});
        console.log(`- Technicians deleted: ${result.deletedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to delete technicians:', error);
        process.exit(1);
    }
};

deleteTechnicians();
