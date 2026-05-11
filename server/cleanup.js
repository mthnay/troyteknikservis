import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Repair from './models/Repair.js';
import Inventory from './models/Inventory.js';
import Customer from './models/Customer.js';
import Earning from './models/Earning.js';
import Media from './models/Media.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile-asp';

const cleanup = async () => {
    try {
        console.log('Connecting to MongoDB for cleanup...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        console.log('Cleaning up data...');

        const repairsDeleted = await Repair.deleteMany({});
        console.log(`- Repairs deleted: ${repairsDeleted.deletedCount}`);

        const inventoryDeleted = await Inventory.deleteMany({});
        console.log(`- Inventory deleted: ${inventoryDeleted.deletedCount}`);

        const customersDeleted = await Customer.deleteMany({});
        console.log(`- Customers deleted: ${customersDeleted.deletedCount}`);

        const earningsDeleted = await Earning.deleteMany({});
        console.log(`- Earnings deleted: ${earningsDeleted.deletedCount}`);

        const mediaDeleted = await Media.deleteMany({});
        console.log(`- Media deleted: ${mediaDeleted.deletedCount}`);

        console.log('Cleanup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
