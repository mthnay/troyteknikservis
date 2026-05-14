import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    role: String,
    storeId: Number
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'email name role storeId');
        console.log(JSON.stringify(users, null, 2));
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkUsers();
