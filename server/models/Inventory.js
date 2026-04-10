import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String, required: true },
    category: { type: String },
    type: { type: String },
    quantity: { type: Number, default: 0 },
    minLevel: { type: Number, default: 5 },
    price: { type: Number, default: 0 },
    location: { type: String },
    storeId: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
