import express from 'express';
import mongoose from 'mongoose';
import Repair from './models/Repair.js';
import User from './models/User.js';
import Inventory from './models/Inventory.js';
import Technician from './models/Technician.js';
import ServicePoint from './models/ServicePoint.js';
import SystemSetting from './models/SystemSetting.js';
import Media from './models/Media.js';
import Customer from './models/Customer.js';
import DeviceModel from './models/DeviceModel.js';
import Earning from './models/Earning.js';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { sendAutomatedEmail } from './emailService.js';

// Multer for memory storage (Database Uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// --- System Routes ---
router.get('/system/check-updates', (req, res) => {
    // Gerçek bir yapıda burada bir GitHub API sorgusu veya versiyon kontrolü yapılır
    res.json({
        available: true,
        version: 'v1.5.0',
        notes: 'Lojistik modülü güncellemeleri ve performans iyileştirmeleri.'
    });
});

router.post('/system/reboot', (req, res) => {
    res.json({ success: true, message: 'Server is rebooting...' });
    
    // İşlemi sonlandırmak için kısa bir gecikme verelim (cevap dönebilsin)
    setTimeout(() => {
        console.log('REBOOT TRIGGERED: Server is exiting...');
        process.exit(0);
    }, 1000);
});
router.get('/fix-stores', async (req, res) => {
    try {
        const firstPoint = await ServicePoint.findOne({});
        if (!firstPoint) return res.status(404).json({ message: 'No service points found' });

        const result = await User.updateMany({}, { storeId: firstPoint.id });
        res.json({
            message: `Linked all users to store: ${firstPoint.name}`,
            storeId: firstPoint.id,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Repairs ---
// Public Route: Cihaz Takibi İstemcisi
router.get('/public/repairs/:id', async (req, res) => {
    try {
        const repair = await Repair.findOne({ id: req.params.id });
        if (!repair) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
        
        // Sadece müşteriye gösterilecek güvenli veriler gönderiliyor
        res.json({
            id: repair.id,
            device: repair.device,
            status: repair.status,
            date: repair.date,
            issue: repair.issue,
            quoteAmount: repair.quoteAmount,
            diagnosisNotes: repair.diagnosisNotes,
            history: repair.history
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Public Route: Teklif Onay/Red
router.post('/public/repairs/:id/quote', async (req, res) => {
    try {
        const { action } = req.body; // 'accept' veya 'reject'
        const repair = await Repair.findOne({ id: req.params.id });
        
        if (!repair) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
        if (repair.status !== 'Müşteri Onayı Bekliyor') {
            return res.status(400).json({ message: 'Bu kayıt şu an teklif aşamasında değildir.' });
        }

        let newStatus = '';
        let note = '';

        if (action === 'accept') {
            newStatus = 'İşlemde';
            note = 'Müşteri onarımı portal üzerinden dijital olarak onayladı.';
        } else if (action === 'reject') {
            newStatus = 'Cihaz Hazır'; // İade için hazır
            note = 'Müşteri onarımı reddetti. Cihaz iadesi için hazırlanıyor.';
        } else {
            return res.status(400).json({ message: 'Geçersiz işlem.' });
        }

        const newHistory = [...(repair.history || []), { status: newStatus, date: new Date().toLocaleString('tr-TR'), note }];
        
        const updatedRepair = await Repair.findOneAndUpdate(
            { id: req.params.id }, 
            { status: newStatus, history: newHistory }, 
            { new: true }
        );
        res.json({ success: true, status: newStatus });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// --- Repairs ---
router.get('/repairs', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }
        const repairs = await Repair.find(filter).sort({ createdAt: -1 });
        res.json(repairs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/repairs', async (req, res) => {
    const repair = new Repair(req.body);
    try {
        const newRepair = await repair.save();
        
        // Otomatik Kabul E-postası Gönder (Arka Planda)
        if (newRepair.customerEmail) {
            sendAutomatedEmail(newRepair, 'Kabul').catch(err => console.error('Auto Email Error:', err));
        }

        res.status(201).json(newRepair);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/repairs/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const oldRepair = await Repair.findOne({ $or: [{ id: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }] });
        
        let updatedRepair = await Repair.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedRepair) {
            updatedRepair = await Repair.findOneAndUpdate({ _id: id }, req.body, { new: true });
        }

        if (updatedRepair) {
            // Eğer durum değiştiyse otomatik e-posta gönder
            if (req.body.status && oldRepair && oldRepair.status !== req.body.status) {
                if (updatedRepair.customerEmail) {
                    sendAutomatedEmail(updatedRepair, updatedRepair.status).catch(err => console.error('Auto Status Email Error:', err));
                }
            }
            res.json(updatedRepair);
        } else {
            res.status(404).json({ message: 'Repair not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/repairs/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = await Repair.findOneAndDelete({ id: id });
        if (!deleted) {
            deleted = await Repair.findOneAndDelete({ _id: id });
        }
        res.json({ message: 'Repair deleted', success: !!deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Users ---
router.get('/users', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) filter.storeId = req.query.storeId;
        
        // Şifre alanını güvenlik için hariç tutuyoruz
        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        // Şifreyi objeden çıkarıp geri kalanı dönüyoruz
        const { password: _, ...userWithoutPassword } = user._doc || user;
        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/users', upload.single('avatar'), async (req, res) => {
    try {
        const userData = req.body;
        // Şifreyi hashleyelim
        if (userData.password) {
            userData.password = bcrypt.hashSync(userData.password, 10);
        }
        const user = new User(userData);
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`[UserUpdate] Request for ID: ${id}`);
        console.log(`[UserUpdate] Body:`, JSON.stringify(req.body, null, 2));

        const updateData = { ...req.body };
        // Şifre sadece doluysa hashle, yoksa sil (mevcut şifre korunsun)
        if (updateData.password && updateData.password.trim() !== "") {
            updateData.password = bcrypt.hashSync(updateData.password, 10);
        } else {
            delete updateData.password;
        }

        // Önce ObjectID (_id) ile, sonra custom id ile dene
        let updatedUser = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        }
        
        if (!updatedUser) {
            updatedUser = await User.findOneAndUpdate({ id: id }, updateData, { new: true });
        }

        if (updatedUser) {
            console.log(`[UserUpdate] SUCCESS: Updated user ${updatedUser.name}`);
            const { password: _, ...userWithoutPassword } = updatedUser._doc || updatedUser;
            res.json(userWithoutPassword);
        } else {
            console.warn(`[UserUpdate] FAILED: User not found for ID: ${id}`);
            res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
    } catch (err) {
        console.error(`[UserUpdate] ERROR:`, err.message);
        res.status(400).json({ message: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = await User.findOneAndDelete({ id: id });
        if (!deleted) {
            deleted = await User.findOneAndDelete({ _id: id });
        }
        res.json({ message: 'User deleted', success: !!deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Forgot Password ---
router.post('/users/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.' });
        }
        
        // Şifreyi e-posta ile gönder (veya sıfırlama linki - yerel simülasyon olduğu için doğrudan hatırlatma yapıyoruz)
        res.json({ 
            success: true, 
            message: 'Şifre hatırlatma yönergesi e-posta adresinize gönderildi.',
            message: 'Eğer e-posta adresi kayıtlıysa, şifre sıfırlama talimatları gönderilecektir.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Inventory ---
router.get('/inventory', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }
        const inventory = await Inventory.find(filter);
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/inventory', async (req, res) => {
    const item = new Inventory(req.body);
    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/inventory/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let updatedItem = await Inventory.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedItem) {
            updatedItem = await Inventory.findOneAndUpdate({ _id: id }, req.body, { new: true });
        }
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/inventory/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`[Inventory] DELETE request for id/_id: ${id}`);
        
        let deleted = await Inventory.findOneAndDelete({ id: id });
        if (!deleted) {
            console.log(`[Inventory] No item found with id: ${id}, trying _id...`);
            deleted = await Inventory.findOneAndDelete({ _id: id });
        }
        
        if (deleted) {
            console.log(`[Inventory] SUCCESS: Deleted item: ${deleted.name} (${deleted.partNumber || deleted.id})`);
            res.json({ message: 'Inventory item deleted', success: true });
        } else {
            console.warn(`[Inventory] FAILED: No record found for ID: ${id}`);
            res.status(404).json({ message: 'Parça bulunamadı.', success: false });
        }
    } catch (err) {
        console.error(`[Inventory] DELETE error:`, err);
        res.status(500).json({ message: err.message });
    }
});

// Decrease stock quantity (Part Usage)
router.post('/inventory/use', async (req, res) => {
    const { partId, quantity } = req.body;
    try {
        let item = await Inventory.findOne({ id: partId });
        if (!item) {
            item = await Inventory.findOne({ _id: partId });
        }
        
        if (!item) {
            return res.status(404).json({ message: 'Parça bulunamadı.' });
        }
        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Yetersiz stok.' });
        }
        const updatedItem = await Inventory.findOneAndUpdate({ _id: item._id }, { quantity: item.quantity - quantity }, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Technicians ---
router.get('/technicians', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }
        const technicians = await Technician.find(filter);
        res.json(technicians);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/technicians/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let updatedTech = await Technician.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedTech) {
            updatedTech = await Technician.findOneAndUpdate({ _id: id }, req.body, { new: true });
        }
        res.json(updatedTech);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/technicians/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = await Technician.findOneAndDelete({ id: id });
        if (!deleted) {
            deleted = await Technician.findOneAndDelete({ _id: id });
        }
        res.json({ message: 'Technician deleted', success: !!deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Service Points ---
router.get('/service-points', async (req, res) => {
    try {
        const points = await ServicePoint.find();
        res.json(points);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/service-points', async (req, res) => {
    const point = new ServicePoint(req.body);
    try {
        const newPoint = await point.save();
        res.status(201).json(newPoint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/service-points/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let updatedPoint = await ServicePoint.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedPoint) {
            updatedPoint = await ServicePoint.findOneAndUpdate({ _id: id }, req.body, { new: true });
        }
        res.json(updatedPoint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/service-points/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = await ServicePoint.findOneAndDelete({ id: id });
        if (!deleted) {
            deleted = await ServicePoint.findOneAndDelete({ _id: id });
        }
        res.json({ message: 'Service Point deleted', success: !!deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- System Settings ---
router.get('/settings/:key', async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ key: req.params.key });
        res.json(setting ? setting.value : null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/settings', async (req, res) => {
    const { key, value } = req.body;
    try {
        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true } // Create if not exists
        );
        res.json(setting.value);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Media (Images in DB) ---
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenemedi.' });
    }
    try {
        const newMedia = new Media({
            data: req.file.buffer,
            contentType: req.file.mimetype,
            name: req.file.originalname
        });
        const savedMedia = await newMedia.save();
        const fullUrl = `${req.protocol}://${req.get('host')}/api/media/${savedMedia._id}`;
        res.json({ url: fullUrl, id: savedMedia._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/media/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).send('Bulunamadı');
        res.set('Content-Type', media.contentType);
        res.send(media.data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- Customers (CRM) ---
router.get('/customers', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }
        const customers = await Customer.find(filter).sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/customers', async (req, res) => {
    try {
        const count = await Customer.countDocuments();
        const customerId = `C-${1000 + count + 1}`;

        const newCustomer = new Customer({
            ...req.body,
            id: customerId
        });
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/customers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let updatedCustomer = await Customer.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedCustomer) {
            updatedCustomer = await Customer.findOneAndUpdate({ _id: id }, req.body, { new: true });
        }
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let deleted = await Customer.findOneAndDelete({ id: id });
        if (!deleted) {
            deleted = await Customer.findOneAndDelete({ _id: id });
        }
        res.json({ message: 'Müşteri silindi', success: !!deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Earnings ---
router.get('/earnings', async (req, res) => {
    try {
        const filter = {};
        if (req.query.storeId) {
            filter.storeId = req.query.storeId;
        }
        const earnings = await Earning.find(filter).sort({ month: -1 });
        res.json(earnings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/earnings', async (req, res) => {
    try {
        const id = `ERN-${Date.now()}`;
        const newEarning = new Earning({ ...req.body, id });
        const savedEarning = await newEarning.save();
        res.status(201).json(savedEarning);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Device Models ---
router.get('/device-models', async (req, res) => {
    try {
        const query = req.query.q;
        let filter = {};
        if (query) {
            filter = { name: { $regex: query, $options: 'i' } };
        }
        const models = await DeviceModel.find(filter).limit(50);
        res.json(models);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/device-models/seed', async (req, res) => {
    try {
        // Clear existing to update with full list
        await DeviceModel.deleteMany({});

        const devices = [
            // --- iPhones ---
            { name: 'iPhone 16 Pro Max', type: 'Phone', configurations: ['256GB', '512GB', '1TB'], colors: ['Desert Titanium', 'Natural Titanium', 'White Titanium', 'Black Titanium'] },
            { name: 'iPhone 16 Pro', type: 'Phone', configurations: ['128GB', '256GB', '512GB', '1TB'], colors: ['Desert Titanium', 'Natural Titanium', 'White Titanium', 'Black Titanium'] },
            { name: 'iPhone 16 Plus', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'] },
            { name: 'iPhone 16', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'] },
            { name: 'iPhone 15 Pro Max', type: 'Phone', configurations: ['256GB', '512GB', '1TB'], colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
            { name: 'iPhone 15 Pro', type: 'Phone', configurations: ['128GB', '256GB', '512GB', '1TB'], colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
            { name: 'iPhone 15 Plus', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'] },
            { name: 'iPhone 15', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'] },
            { name: 'iPhone 14 Pro Max', type: 'Phone', configurations: ['128GB', '256GB', '512GB', '1TB'], colors: ['Deep Purple', 'Gold', 'Silver', 'Space Black'] },
            { name: 'iPhone 13', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Green', 'Pink', 'Blue', 'Midnight', 'Starlight', 'Red'] },
            { name: 'iPhone 13 mini', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Green', 'Pink', 'Blue', 'Midnight', 'Starlight', 'Red'] },
            { name: 'iPhone 12 Pro Max', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Pacific Blue', 'Gold', 'Graphite', 'Silver'] },
            { name: 'iPhone 12 Pro', type: 'Phone', configurations: ['128GB', '256GB', '512GB'], colors: ['Pacific Blue', 'Gold', 'Graphite', 'Silver'] },
            { name: 'iPhone 12', type: 'Phone', configurations: ['64GB', '128GB', '256GB'], colors: ['Blue', 'Green', 'Red', 'White', 'Black', 'Purple'] },
            { name: 'iPhone 11 Pro Max', type: 'Phone', configurations: ['64GB', '256GB', '512GB'], colors: ['Midnight Green', 'Silver', 'Space Gray', 'Gold'] },
            { name: 'iPhone 11', type: 'Phone', configurations: ['64GB', '128GB', '256GB'], colors: ['Green', 'Purple', 'White', 'Yellow', 'Black', 'Red'] },
            { name: 'iPhone XS Max', type: 'Phone', configurations: ['64GB', '256GB', '512GB'], colors: ['Gold', 'Silver', 'Space Gray'] },
            { name: 'iPhone XS', type: 'Phone', configurations: ['64GB', '256GB', '512GB'], colors: ['Gold', 'Silver', 'Space Gray'] },
            { name: 'iPhone XR', type: 'Phone', configurations: ['64GB', '128GB', '256GB'], colors: ['Blue', 'White', 'Black', 'Yellow', 'Coral', 'Red'] },
            { name: 'iPhone X', type: 'Phone', configurations: ['64GB', '256GB'], colors: ['Silver', 'Space Gray'] },
            { name: 'iPhone SE (3rd Gen)', type: 'Phone', configurations: ['64GB', '128GB', '256GB'], colors: ['Midnight', 'Starlight', 'Red'] },

            // --- iPads ---
            { name: 'iPad Pro 13" (M4)', type: 'Tablet', configurations: ['256GB', '512GB', '1TB', '2TB'], colors: ['Space Black', 'Silver'] },
            { name: 'iPad Pro 11" (M4)', type: 'Tablet', configurations: ['256GB', '512GB', '1TB', '2TB'], colors: ['Space Black', 'Silver'] },
            { name: 'iPad Air 13" (M2)', type: 'Tablet', configurations: ['128GB', '256GB', '512GB', '1TB'], colors: ['Space Gray', 'Starlight', 'Blue', 'Purple'] },
            { name: 'iPad Air 11" (M2)', type: 'Tablet', configurations: ['128GB', '256GB', '512GB', '1TB'], colors: ['Space Gray', 'Starlight', 'Blue', 'Purple'] },
            { name: 'iPad mini (A17 Pro)', type: 'Tablet', configurations: ['128GB', '256GB', '512GB'], colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'] },
            { name: 'iPad (10th Gen)', type: 'Tablet', configurations: ['64GB', '256GB'], colors: ['Blue', 'Pink', 'Yellow', 'Silver'] },

            // --- Macs ---
            { name: 'MacBook Pro 14" (M4/Pro/Max)', type: 'Mac', configurations: ['512GB', '1TB', '2TB', '4TB'], colors: ['Space Black', 'Silver'] },
            { name: 'MacBook Pro 16" (M4/Pro/Max)', type: 'Mac', configurations: ['512GB', '1TB', '2TB', '4TB'], colors: ['Space Black', 'Silver'] },
            { name: 'MacBook Pro 14" (M3)', type: 'Mac', configurations: ['512GB', '1TB'], colors: ['Space Black', 'Silver'] },
            { name: 'MacBook Air 13" (M3)', type: 'Mac', configurations: ['256GB', '512GB'], colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'] },
            { name: 'MacBook Air 15" (M3)', type: 'Mac', configurations: ['256GB', '512GB'], colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'] },
            { name: 'iMac 24" (M4)', type: 'Mac', configurations: ['256GB', '512GB'], colors: ['Blue', 'Green', 'Pink', 'Silver', 'Yellow', 'Orange', 'Purple'] },
            { name: 'Mac mini (M4/Pro)', type: 'Mac', configurations: ['256GB', '512GB'], colors: ['Silver'] },
            { name: 'Mac Studio (M2 Max/Ultra)', type: 'Mac', configurations: ['512GB', '1TB', '2TB'], colors: ['Silver'] },

            // --- Wearables ---
            { name: 'Apple Watch Ultra 2', type: 'Watch', configurations: ['49mm'], colors: ['Black Titanium', 'Natural Titanium'] },
            { name: 'Apple Watch Series 10', type: 'Watch', configurations: ['42mm', '46mm'], colors: ['Jet Black', 'Rose Gold', 'Silver Titanium', 'Slate Titanium', 'Natural Titanium'] },
            { name: 'Apple Watch Series 9', type: 'Watch', configurations: ['41mm', '45mm'], colors: ['Midnight', 'Starlight', 'Silver', 'Pink', 'Red'] },
            { name: 'Apple Watch SE (2nd Gen)', type: 'Watch', configurations: ['40mm', '44mm'], colors: ['Midnight', 'Starlight', 'Silver'] },

            // --- New Categories ---
            { name: 'Apple Vision Pro', type: 'Vision', configurations: ['256GB', '512GB', '1TB'], colors: ['Standard'] },

            // --- Audio ---
            { name: 'AirPods Pro (2nd Gen) USB-C', type: 'Accessory', configurations: ['Standard'], colors: ['White'] },
            { name: 'AirPods 4', type: 'Accessory', configurations: ['Standard', 'Active Noise Cancellation'], colors: ['White'] },
            { name: 'AirPods Max (USB-C)', type: 'Accessory', configurations: ['Standard'], colors: ['Midnight', 'Starlight', 'Blue', 'Orange', 'Purple'] }
        ];

        await DeviceModel.insertMany(devices);
        res.json({ message: 'Device models seeded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
