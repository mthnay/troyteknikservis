import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const roleSchema = new mongoose.Schema({
    name: String,
    displayName: String,
    permissions: [String],
    isSystem: Boolean
});

const Role = mongoose.model('Role', roleSchema);

const yoneticiRole = {
    name: 'Yonetici',
    displayName: 'Yönetici',
    permissions: [
        'view_all_stores',
        'manage_settings',
        'manage_users',
        'view_dashboard',
        'manage_stock',
        'edit_repairs',
        'delete_repairs',
        'view_earnings',
        'view_kbb',
        'view_technicians'
    ],
    isSystem: true
};

async function seedYoneticiRole() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const existing = await Role.findOne({ 
            $or: [
                { name: 'Yonetici' }, 
                { name: 'yonetici' }, 
                { displayName: 'Yönetici' }
            ] 
        });
        
        if (existing) {
            console.log('Yönetici rolü zaten mevcut:', existing.displayName, '(' + existing.name + ')');
            // Ensure permissions are up to date
            await Role.updateOne({ _id: existing._id }, { 
                permissions: yoneticiRole.permissions,
                displayName: 'Yönetici',
                isSystem: true
            });
            console.log('İzinler güncellendi.');
        } else {
            const created = await Role.create(yoneticiRole);
            console.log('Yönetici rolü oluşturuldu:', created._id);
        }
        
        // List all roles
        const allRoles = await Role.find({}, 'name displayName permissions');
        console.log('\nMevcut tüm roller:');
        allRoles.forEach(r => console.log(`  - ${r.displayName} (${r.name}): ${r.permissions.join(', ')}`));
        
        await mongoose.connection.close();
        console.log('\nTamamlandı!');
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
}

seedYoneticiRole();
