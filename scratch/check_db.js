import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Modeller
import User from '../server/models/User.js';
import Repair from '../server/models/Repair.js';
import Inventory from '../server/models/Inventory.js';
import ServicePoint from '../server/models/ServicePoint.js';
import SystemSetting from '../server/models/SystemSetting.js';
import Earning from '../server/models/Earning.js';
import Customer from '../server/models/Customer.js';
import DeviceModel from '../server/models/DeviceModel.js';
import Technician from '../server/models/Technician.js';
import Media from '../server/models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATA_DIR = path.join(process.cwd(), 'local-data');
const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
    console.log('--- Veritabanı Kontrolü Başlatılıyor ---\n');
    
    if (!MONGODB_URI) {
        console.error('❌ Hata: MONGODB_URI .env dosyasında bulunamadı.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Atlas\'a başarıyla bağlandı.\n');

        const modelsMap = {
            'User': { model: User, file: 'User.json' },
            'Repair': { model: Repair, file: 'Repair.json' },
            'Inventory': { model: Inventory, file: 'Inventory.json' },
            'ServicePoint': { model: ServicePoint, file: 'ServicePoint.json' },
            'SystemSetting': { model: SystemSetting, file: 'SystemSetting.json' },
            'Earning': { model: Earning, file: 'Earning.json' },
            'Customer': { model: Customer, file: 'Customer.json' },
            'DeviceModel': { model: DeviceModel, file: 'DeviceModel.json' },
            'Technician': { model: Technician, file: 'Technician.json' },
            'Media': { model: Media, file: 'Media.json' }
        };

        const results = [];

        for (const [name, config] of Object.entries(modelsMap)) {
            const dbCount = await config.model.countDocuments();
            
            let localCount = 0;
            const filePath = path.join(DATA_DIR, config.file);
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    localCount = Array.isArray(data) ? data.length : 0;
                } catch (e) {
                    localCount = 'Hata (JSON Okunamadı)';
                }
            } else {
                localCount = 'Dosya Yok';
            }

            let issues = [];
            if (dbCount > 0) {
                const sample = await config.model.find().limit(20);
                if (name === 'Repair' && sample.some(r => !r.id)) issues.push('Bazı onarımlarda "id" alanı eksik.');
                if (name === 'Customer' && sample.some(c => !c.name)) issues.push('Bazı müşterilerde "isim" alanı eksik.');
            }

            results.push({
                Koleksiyon: name,
                'DB Kayıt': dbCount,
                'Yerel Kayıt': localCount,
                'Durum': dbCount == localCount ? '✅ Eşleşti' : (dbCount > localCount ? '🔼 DB Daha Fazla' : '🔻 DB Eksik'),
                'Notlar': issues.length > 0 ? issues.join(', ') : '-'
            });
        }

        console.table(results);

        console.log('\n--- İlişki Kontrolleri ---');
        const orphanRepairs = await Repair.find({ storeId: { $exists: false } }).countDocuments();
        if (orphanRepairs > 0) console.warn(`⚠️  Dikkat: ${orphanRepairs} adet onarım kaydında storeId eksik.`);
        else console.log('✅ Onarım-Mağaza ilişkileri (storeId) sağlıklı görünüyor.');

        const invalidPrices = await Inventory.find({ price: { $lt: 0 } }).countDocuments();
        if (invalidPrices > 0) console.warn(`⚠️  Dikkat: ${invalidPrices} adet stok kaleminde hatalı fiyat saptandı.`);
        else console.log('✅ Stok fiyatlandırmaları tutarlı.');

        console.log('\n--- Kontrol Tamamlandı ---');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Kontrol sırasında hata oluştu:', err.message);
        process.exit(1);
    }
}

checkDatabase();
