import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const userSchema = new mongoose.Schema({
    email: String,
    storeId: Number
});

const User = mongoose.model('User', userSchema);

async function updateStore() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await User.updateOne({ email: 'mete@oss.com' }, { storeId: 1 });
        console.log("Store ID updated for mete@oss.com to 1");
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

updateStore();
