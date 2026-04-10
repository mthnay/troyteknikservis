import React, { useState } from 'react';
import { Package, Search, Plus, AlertTriangle, Monitor, Battery, Cpu, Filter, ArrowUpRight, ArrowDownRight, X, ChevronDown, Check, Box, Tag, Layers, Trash2, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import MyPhoneIcon from './LocalIcons';

const StockManagement = () => {
    const { inventory, addInventoryItem, updateInventoryItem, removeInventoryItem, servicePoints, currentUser } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [warehouseType, setWarehouseType] = useState('KGB'); // 'KGB' (Yeni/Temiz) or 'KBB' (Eski/Arızalı)
    const [storeFilter, setStoreFilter] = useState('all'); // Store-based filter
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPartDetails, setSelectedPartDetails] = useState(null);
    const [transferPart, setTransferPart] = useState(null); // For custom transfer modal
    const [confirmDelete, setConfirmDelete] = useState(null); // For custom delete confirmation
    const [newPart, setNewPart] = useState({ name: '', id: '', category: 'iPhone', type: 'Ekran', quantity: 0, minLevel: 5, price: 0, location: '', warehouseType: 'KGB' });

    const categories = [
        { id: 'all', label: 'Tümü', icon: Package },
        { id: 'iPhone', label: 'iPhone', icon: MyPhoneIcon },
        { id: 'Mac', label: 'Mac', icon: Monitor },
        { id: 'iPad', label: 'iPad', icon: Cpu },
        { id: 'Aksesuar', label: 'Aksesuar', icon: Battery },
    ];

    const baseFilteredParts = inventory.filter(part => {
        const isKBB = part.warehouseType === 'KBB' || (part.type || '').toLowerCase().includes('kbb');
        const matchesWarehouse = warehouseType === 'KGB' ? !isKBB : isKBB;
        const matchesStore = storeFilter === 'all' || String(part.storeId) === String(storeFilter);
        return matchesWarehouse && matchesStore;
    });

    const filteredParts = baseFilteredParts.filter(part => {
        const searchSafe = searchTerm.toLowerCase();
        const matchesSearch = 
            (part.name?.toLowerCase() || '').includes(searchSafe) ||
            (part.id?.toLowerCase() || '').includes(searchSafe) ||
            (part.partNumber?.toLowerCase() || '').includes(searchSafe) ||
            (part.sku?.toLowerCase() || '').includes(searchSafe) ||
            (part.model?.toLowerCase() || '').includes(searchSafe);
            
        const matchesCategory = activeCategory === 'all' || part.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const totalItems = baseFilteredParts.reduce((acc, part) => acc + part.quantity, 0);
    const lowStockItems = baseFilteredParts.filter(part => part.quantity <= part.minLevel).length;
    const totalValue = baseFilteredParts.reduce((acc, part) => acc + (part.price * part.quantity), 0);

    const handleAddPart = (e) => {
        e.preventDefault();
        // If admin selected a store, use it. Otherwise use current user's store.
        const targetStoreId = newPart.storeId || currentUser.storeId;
        addInventoryItem({ ...newPart, storeId: parseInt(targetStoreId) });
        setShowAddModal(false);
        setNewPart({ name: '', id: '', category: 'iPhone', type: 'Ekran', quantity: 0, minLevel: 5, price: 0, location: '', warehouseType: 'KGB' });
    };

    const updateStock = (id, change) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            updateInventoryItem(id, { quantity: Math.max(0, item.quantity + change) });
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-32 animate-fade-in px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl bg-white/40 p-6 rounded-[32px] border border-white/50 shadow-sm sticky top-4 z-30">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Package size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">Envanter Yönetimi</h2>
                        <p className="text-gray-500 font-medium">Stok durumu, parça takibi ve envanter analizleri.</p>
                    </div>
                </div>
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                        <button 
                            onClick={() => setWarehouseType('KGB')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${warehouseType === 'KGB' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            KGB Ambar (Yeni)
                        </button>
                        <button 
                            onClick={() => setWarehouseType('KBB')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${warehouseType === 'KBB' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            KBB Ambar (Eski)
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        Parça Ekle
                    </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Toplam Stok Adedi', value: totalItems, icon: Layers, color: 'text-blue-600', bg: 'bg-white', border: 'group-hover:border-blue-300', iconBg: 'bg-blue-50' },
                    { label: 'Kritik Stok Uyarısı', value: lowStockItems, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-white', border: 'group-hover:border-red-300', iconBg: 'bg-red-50', animate: true },
                    { label: 'Toplam Envanter Değeri', value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(totalValue), icon: Tag, color: 'text-green-600', bg: 'bg-white', border: 'group-hover:border-green-300', iconBg: 'bg-green-50' }
                ].map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-6 rounded-[28px] flex items-center justify-between border border-transparent shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-100 ${stat.border}`}>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-widest mb-2 opacity-60 ${stat.color === 'text-gray-900' ? 'text-gray-500' : stat.color.replace('600', '500').replace('500', '400')}`}>{stat.label}</p>
                            <h3 className={`text-4xl font-black ${stat.color} tracking-tight`}>{stat.value}</h3>
                        </div>
                        <div className={`w-14 h-14 ${stat.iconBg} rounded-2xl flex items-center justify-center ${stat.color} shadow-inner transition-transform group-hover:rotate-6 ${stat.animate ? 'animate-pulse' : ''}`}>
                            <stat.icon size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden min-h-[600px] flex flex-col">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-between gap-6 md:flex-row bg-white z-20">
                    {/* Category Tabs */}
                    <div className="flex p-1.5 bg-gray-100/80 rounded-2xl w-full md:w-auto overflow-x-auto shadow-inner no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wide ${activeCategory === cat.id
                                    ? 'bg-white text-gray-900 shadow-md transform scale-100'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <cat.icon size={16} className={activeCategory === cat.id ? 'text-indigo-500' : ''} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search & Global Filter */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Parça ara..."
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm group-hover:shadow-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {currentUser?.role === 'admin' && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                                    className={`p-3.5 rounded-2xl border flex items-center gap-2 font-bold transition-all ${storeFilter !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'}`}
                                >
                                    <Filter size={20} />
                                    {storeFilter !== 'all' && (
                                        <span className="text-xs">{servicePoints.find(s => String(s.id) === String(storeFilter))?.name}</span>
                                    )}
                                </button>
                                
                                {showStoreDropdown && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-[50] py-4 animate-in slide-in-from-top-4 duration-300">
                                        <h4 className="px-6 text-[10px] font-black uppercase text-gray-400 mb-2">Mağaza Seçiniz</h4>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            <button 
                                                onClick={() => { setStoreFilter('all'); setShowStoreDropdown(false); }}
                                                className={`w-full text-left px-6 py-3 font-bold text-sm transition-colors ${storeFilter === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                Tüm Mağazalar
                                            </button>
                                            {servicePoints.map(s => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => { setStoreFilter(s.id); setShowStoreDropdown(false); }}
                                                    className={`w-full text-left px-6 py-3 font-bold text-sm transition-colors ${String(storeFilter) === String(s.id) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                                <th className="px-8 py-5">Görsel</th>
                                <th className="px-8 py-5">Parça Bilgisi</th>
                                <th className="px-8 py-5">Kategori / Tip</th>
                                <th className="px-8 py-5">Lokasyon</th>
                                <th className="px-8 py-5">Stok Durumu</th>
                                <th className="px-8 py-5">Birim Fiyat</th>
                                <th className="px-8 py-5 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredParts.length > 0 ? (
                                filteredParts.map((part) => (
                                    <tr 
                                        key={part._id || part.id} 
                                        onClick={() => setSelectedPartDetails(part)}
                                        className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-gray-500 text-[10px] mb-1">{part.id}</span>
                                                {currentUser?.role === 'admin' && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase rounded-lg text-gray-400 w-fit">
                                                        {servicePoints.find(s => String(s.id) === String(part.storeId))?.name || 'Genel'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100/50 shadow-inner group-hover:scale-110 transition-transform">
                                                <img src={part.image || getProductImage(part.category, part.name)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{part.name}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-600 border border-gray-200 uppercase tracking-wide">
                                                    {part.category}
                                                </span>
                                                <span className="text-gray-300 text-[10px]">•</span>
                                                <span className="text-gray-600 font-medium text-xs">{part.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-gray-500 font-mono text-xs font-medium">
                                            {part.location || '-'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1.5 w-32">
                                                <div className={`flex items-center justify-between font-bold text-sm ${part.quantity <= part.minLevel ? 'text-red-600' : 'text-gray-900'
                                                    }`}>
                                                    <span>{part.quantity} <span className="text-[10px] font-normal text-gray-400 uppercase">Adet</span></span>
                                                    {part.quantity <= part.minLevel && (
                                                        <AlertTriangle size={12} className="text-red-500 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${Math.min(100, (part.quantity / (part.minLevel * 3)) * 100)}%` }}
                                                        className={`h-full rounded-full transition-all duration-500 ${part.quantity <= part.minLevel ? 'bg-red-500' : 'bg-green-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-black text-gray-900 text-sm">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(part.price)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                {currentUser?.role === 'admin' && (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTransferPart(part);
                                                            }}
                                                            className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-gray-200 hover:border-indigo-200"
                                                            title="Mağazaya Taşı"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDelete(part);
                                                            }}
                                                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-gray-200 hover:border-red-200"
                                                            title="Envanterden Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                <button onClick={() => updateStock(part.id, 1)} className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-gray-200 hover:border-green-200 active:scale-95" title="Stok Ekle">
                                                    <ArrowUpRight size={16} strokeWidth={3} />
                                                </button>
                                                <button onClick={() => updateStock(part.id, -1)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-gray-200 hover:border-red-200 active:scale-95" title="Stok Çıkar">
                                                    <ArrowDownRight size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-8 py-32 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                                <Search size={40} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 mb-1">Sonuç Bulunamadı</h3>
                                            <p className="text-sm font-medium text-gray-500">Aradığınız kriterlere uygun parça kaydı mevcut değil.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Part Detail Modal */}
            {selectedPartDetails && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-8 animate-scale-up border border-white/50 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedPartDetails.name}</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Seri Numarası & Konum Takibi (P/N: {selectedPartDetails.partNumber || selectedPartDetails.id})</p>
                            </div>
                            <button onClick={() => setSelectedPartDetails(null)} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-500 hover:text-gray-900"><X size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                                <Box className="text-blue-500" size={24} />
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Toplam Mevcut Stok</p>
                                    <p className="text-lg font-black text-blue-900">
                                        {inventory.filter(i => (i.partNumber === selectedPartDetails.partNumber || i.name === selectedPartDetails.name)).reduce((acc, i) => acc + i.quantity, 0)} Adet
                                    </p>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar border border-gray-100 rounded-3xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 sticky top-0 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Mağaza / Ambar</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Seri Numaraları</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Miktar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inventory
                                            .filter(i => (i.partNumber === selectedPartDetails.partNumber || i.name === selectedPartDetails.name))
                                            .map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 text-sm">
                                                                {servicePoints.find(s => String(s.id) === String(item.storeId))?.name}
                                                            </span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase mt-0.5">
                                                                {item.warehouseType || 'KGB'} AMBARI
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(item.kbbSerials && item.kbbSerials.length > 0) ? (
                                                                item.kbbSerials.map((serial, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-[10px] font-mono font-bold text-gray-600 rounded-md border border-gray-200">
                                                                        {serial}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 italic">Seri no kaydı yok</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-gray-900 text-sm">
                                                        {item.quantity}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={() => setSelectedPartDetails(null)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <form onSubmit={handleAddPart} className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl p-8 animate-scale-up border border-white/50 relative overflow-hidden">
                        {/* Decorative background blob */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Yeni Parça Girişi</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Envantere yeni bir parça ekleyin.</p>
                            </div>
                            <button type="button" onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-500 hover:text-gray-900"><X size={20} /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-5 relative z-10">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Parça Adı</label>
                                <input
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                    placeholder="Örn: iPhone 13 Ekran (Orijinal)"
                                    value={newPart.name}
                                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Parça Kodu</label>
                                <input
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono font-bold text-gray-900 text-sm placeholder:text-gray-400"
                                    placeholder="STK-001"
                                    value={newPart.id}
                                    onChange={e => setNewPart({ ...newPart, id: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Kategori</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold text-gray-900"
                                        value={newPart.category}
                                        onChange={e => setNewPart({ ...newPart, category: e.target.value })}
                                    >
                                        <option>iPhone</option><option>Mac</option><option>iPad</option><option>Aksesuar</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Stok Adedi</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                    value={newPart.quantity}
                                    onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Kritik Seviye</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                    value={newPart.minLevel}
                                    onChange={e => setNewPart({ ...newPart, minLevel: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Depo Türü</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold text-gray-900"
                                        value={newPart.warehouseType}
                                        onChange={e => setNewPart({ ...newPart, warehouseType: e.target.value })}
                                    >
                                        <option value="KGB">KGB (Yeni)</option>
                                        <option value="KBB">KBB (Eski/İade)</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {currentUser?.role === 'admin' && (
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Hedef Mağaza</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold text-gray-900"
                                            value={newPart.storeId || ''}
                                            onChange={e => setNewPart({ ...newPart, storeId: e.target.value })}
                                        >
                                            <option value="">Mağaza Seçiniz...</option>
                                            {servicePoints.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8 relative z-10">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Check size={20} strokeWidth={3} /> Kaydet ve Ekle
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Move Part Modal */}
            {transferPart && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 animate-scale-up border border-white/50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Stok Transferi</h3>
                            <button onClick={() => setTransferPart(null)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"><X size={16} /></button>
                        </div>
                        
                        <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Transfer Edilecek Parça</p>
                            <p className="text-sm font-bold text-indigo-900">{transferPart.name}</p>
                            <p className="text-[10px] font-mono text-indigo-400 mt-1">Stok ID: {transferPart.id}</p>
                        </div>

                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Hedef Mağaza Seçin</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {servicePoints.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => {
                                        updateInventoryItem(transferPart._id || transferPart.id, { storeId: parseInt(s.id) });
                                        setTransferPart(null);
                                    }}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all font-bold text-sm flex items-center justify-between group/store ${String(s.id) === String(transferPart.storeId) ? 'bg-indigo-50 border-indigo-100 text-indigo-600 cursor-default opacity-50' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-indigo-500 text-gray-700 hover:shadow-md'}`}
                                    disabled={String(s.id) === String(transferPart.storeId)}
                                >
                                    <span>{s.name}</span>
                                    {String(s.id) === String(transferPart.storeId) ? (
                                        <span className="text-[9px] font-black uppercase text-indigo-400">Şu Anki Konum</span>
                                    ) : (
                                        <ArrowUpRight size={14} className="opacity-0 group-hover/store:opacity-100 transition-all" />
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => setTransferPart(null)}
                            className="w-full mt-6 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-red-900/20 backdrop-blur-md z-[90] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-8 animate-scale-up border border-red-50 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Emin misiniz?</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8 px-4">
                            <span className="text-red-600 font-bold">{confirmDelete.name}</span> adlı parçayı envanterden tamamen silmek üzeresiniz. Bu işlem <span className="underline">geri alınamaz.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold transition-all">Vazgeç</button>
                            <button 
                                onClick={async () => {
                                    try {
                                        const success = await removeInventoryItem(confirmDelete._id || confirmDelete.id);
                                        if (success) {
                                            showToast('Parça envanterden silindi.', 'success');
                                        } else {
                                            showToast('Parça silinemedi (ID bulunamadı).', 'error');
                                        }
                                    } catch (err) {
                                        showToast('Silme işlemi sırasında hata oluştu.', 'error');
                                    }
                                    setConfirmDelete(null);
                                }} 
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-200 hover:shadow-red-300 transition-all active:scale-95"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
