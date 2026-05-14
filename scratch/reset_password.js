import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const hashedPassword = await bcrypt.hash('123', 10);
        await User.updateOne({ email: 'mete@oss.com' }, { password: hashedPassword });
        console.log("Password reset for mete@oss.com to '123'");
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

resetPassword();
