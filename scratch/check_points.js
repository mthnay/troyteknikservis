import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const servicePointSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.Mixed,
    name: String
});

const ServicePoint = mongoose.model('ServicePoint', servicePointSchema);

async function checkServicePoints() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const points = await ServicePoint.find({}, 'id name');
        console.log(JSON.stringify(points, null, 2));
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkServicePoints();
