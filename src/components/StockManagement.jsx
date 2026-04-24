import React, { useState } from 'react';
import { Package, Search, Plus, AlertTriangle, Monitor, Battery, Cpu, Filter, ArrowUpRight, ArrowDownRight, X, ChevronDown, Check, Box, Tag, Layers, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import MyPhoneIcon from './LocalIcons';
import { hasPermission } from '../utils/permissions';

const StockManagement = () => {
    const { inventory, addInventoryItem, updateInventoryItem, removeInventoryItem, servicePoints, currentUser, showToast, transferInventorySerial } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    // Using simple boolean or exact match for 'KGB'/'KBB'
    const [warehouseType, setWarehouseType] = useState('KGB'); 
    const [storeFilter, setStoreFilter] = useState('all');
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPartDetails, setSelectedPartDetails] = useState(null);
    const [transferPart, setTransferPart] = useState(null);
    const [selectedSerialsToTransfer, setSelectedSerialsToTransfer] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [newPart, setNewPart] = useState({ name: '', id: '', category: 'iPhone', type: 'Ekran', quantity: 0, minLevel: 5, price: 0, location: '', warehouseType: 'KGB' });

    const categories = [
        { id: 'all', label: 'Tümü' },
        { id: 'iPhone', label: 'iPhone' },
        { id: 'Mac', label: 'Mac' },
        { id: 'iPad', label: 'iPad' },
        { id: 'Aksesuar', label: 'Aksesuar' },
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
    const totalValue = baseFilteredParts.reduce((acc, part) => acc + ((part.price || 0) * part.quantity), 0);

    const handleAddPart = async (e) => {
        e.preventDefault();
        const targetStoreId = newPart.storeId || currentUser.storeId;
        const success = await addInventoryItem({ ...newPart, storeId: parseInt(targetStoreId) });
        if (success) {
            setShowAddModal(false);
            setNewPart({ name: '', id: '', category: 'iPhone', type: 'Ekran', quantity: 0, minLevel: 5, price: 0, location: '', warehouseType: 'KGB' });
            showToast('Parça başarıyla eklendi', 'success');
        } else {
            showToast('Ekleme başarısız! Parça kodu benzersiz olmalıdır veya sunucu hatası.', 'error');
        }
    };

    const updateStock = (id, change) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            updateInventoryItem(id, { quantity: Math.max(0, item.quantity + change) });
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-24 animate-fade-in font-sans">
            {/* Minimalist Apple Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/60 mt-4 px-2">
                <div>
                    <h1 className="text-[34px] font-semibold text-gray-900 tracking-tight leading-none mb-2">Envanter</h1>
                    <p className="text-[15px] text-gray-500">Stok durumu, parça takibi ve genel değerlendirme.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* iOS style segmented control */}
                    <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50 backdrop-blur-md">
                        <button 
                            onClick={() => setWarehouseType('KGB')}
                            className={`px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${warehouseType === 'KGB' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            KGB (Yeni)
                        </button>
                        <button 
                            onClick={() => setWarehouseType('KBB')}
                            className={`px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${warehouseType === 'KBB' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            KBB (Eski)
                        </button>
                    </div>
                    {hasPermission(currentUser, 'view_all_stores') && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                                className={`h-9 px-4 rounded-lg flex items-center gap-2 text-[13px] font-medium transition-all ${storeFilter !== 'all' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700'}`}
                            >
                                <Filter size={14} />
                                {storeFilter !== 'all' ? servicePoints.find(s => String(s.id) === String(storeFilter))?.name : 'Tüm Mağazalar'}
                            </button>
                            {showStoreDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStoreDropdown(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <button onClick={() => { setStoreFilter('all'); setShowStoreDropdown(false); }} className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-black/5 text-gray-700">Tüm Mağazalar</button>
                                        <div className="h-px bg-gray-200/50 my-1"></div>
                                        {servicePoints.map(s => (
                                            <button key={s.id} onClick={() => { setStoreFilter(s.id); setShowStoreDropdown(false); }} className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-black/5 text-gray-700">{s.name}</button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> Parça Ekle
                    </button>
                </div>
            </div>

            {/* Apple style Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Toplam Parça', value: totalItems, subtitle: 'Envanterdeki parçalar', icon: Package, color: 'text-gray-900', bg: 'bg-white' },
                    { label: 'Kritik Stok Uyarısı', value: lowStockItems, subtitle: 'Tedarik gerekenler', icon: AlertTriangle, color: lowStockItems > 0 ? 'text-red-500' : 'text-gray-900', bg: 'bg-white' },
                    { label: 'Envanter Değeri', value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(totalValue), subtitle: 'Genel tutar', icon: Tag, color: 'text-gray-900', bg: 'bg-gradient-to-br from-gray-50 to-white' }
                ].map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-6 rounded-2xl border border-gray-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)]`}> 
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                                <stat.icon size={18} className="text-gray-600" />
                            </div>
                        </div>
                        <h3 className={`text-3xl font-semibold ${stat.color} tracking-tight`}>{stat.value}</h3>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Board */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
                    <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeCategory === cat.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Parça adı veya P/N ile ara..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200/80 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-white">
                                <th className="px-6 py-3 font-medium">BİLGİ</th>
                                <th className="px-6 py-3 font-medium">KATEGORİ</th>
                                <th className="px-6 py-3 font-medium">STOK</th>
                                <th className="px-6 py-3 font-medium">FİYAT</th>
                                <th className="px-6 py-3 font-medium text-right">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredParts.length > 0 ? (
                                filteredParts.map((part) => (
                                    <tr 
                                        key={part._id || part.id} 
                                        onClick={() => setSelectedPartDetails(part)}
                                        className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100/80 rounded-lg overflow-hidden border border-gray-200/50 flex-shrink-0 flex items-center justify-center p-1">
                                                    <img src={part.image || getProductImage(part.category, part.name)} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[14px] text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{part.name}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[12px] text-gray-500 font-mono">{part.id}</span>
                                                        {hasPermission(currentUser, 'view_all_stores') && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="text-[11px] text-gray-500 bg-gray-100 font-medium px-1.5 rounded leading-tight border border-gray-200">
                                                                    {servicePoints.find(s => String(s.id) === String(part.storeId))?.name || 'Genel'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[13px] text-gray-700">{part.category}</span>
                                                <span className="text-[12px] text-gray-500">{part.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[14px] font-medium ${part.quantity <= part.minLevel ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {part.quantity}
                                                </span>
                                                {part.quantity <= part.minLevel && (
                                                    <AlertCircle size={14} className="text-red-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[14px] text-gray-900 font-medium">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(part.price || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {hasPermission(currentUser, 'manage_stock') && (
                                                    <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setTransferPart(part); setSelectedSerialsToTransfer([]); }}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Mağazaya Taşı"
                                                    >
                                                            <RotateCcw size={15} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(part); }}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mr-2" title="Sil"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                                <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-0.5" onClick={e=>e.stopPropagation()}>
                                                    <button onClick={() => updateStock(part.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded transition-all">
                                                        <ArrowDownRight size={14} />
                                                    </button>
                                                    <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                                                    <button onClick={() => updateStock(part.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded transition-all">
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Search size={24} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-[15px] font-medium text-gray-900 mb-1">Kayıt Bulunamadı</h3>
                                            <p className="text-[13px] text-gray-500">Aramanıza uygun bir sonuç eşleşmedi.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Part Detail Details Modal */}
            {selectedPartDetails && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-2xl w-full max-w-[500px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 relative overflow-hidden ring-1 ring-black/5 animate-scale-up">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-1.5">
                                    <img src={selectedPartDetails.image || getProductImage(selectedPartDetails.category, selectedPartDetails.name)} alt="" className="object-contain w-full h-full mix-blend-multiply" />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">{selectedPartDetails.name}</h3>
                                    <p className="text-[13px] text-gray-500 font-mono mt-0.5">{selectedPartDetails.partNumber || selectedPartDetails.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPartDetails(null)} className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-gray-500"><X size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Box className="text-blue-500" size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">Mevcut Stok</p>
                                        <p className="text-[15px] font-semibold text-gray-900">
                                            {inventory.filter(i => (i.partNumber === selectedPartDetails.partNumber || i.name === selectedPartDetails.name)).reduce((acc, i) => acc + i.quantity, 0)} Adet
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">Birim Fiyat</p>
                                    <p className="text-[15px] font-semibold text-gray-900">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedPartDetails.price || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm max-h-60 overflow-y-auto override-scrollbar">
                                <table className="w-full text-left text-[13px]">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-2.5 font-medium text-gray-500">Konum</th>
                                            <th className="px-4 py-2.5 font-medium text-gray-500 text-right">Miktar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inventory
                                            .filter(i => (i.partNumber === selectedPartDetails.partNumber || i.name === selectedPartDetails.name))
                                            .map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900">
                                                                {servicePoints.find(s => String(s.id) === String(item.storeId))?.name}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500">
                                                                {item.warehouseType || 'KGB'} Ambari
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                        {item.quantity}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => setSelectedPartDetails(null)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors w-full"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Minimal Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <form onSubmit={handleAddPart} className="bg-white/90 backdrop-blur-2xl rounded-2xl w-full max-w-[480px] shadow-2xl p-6 relative overflow-hidden ring-1 ring-black/5 animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[17px] font-semibold text-gray-900">Yeni Parça Ekle</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-gray-500"><X size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input
                                    required
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[14px]"
                                    placeholder="Parça Adı (Örn: iPhone 13 Ekran)"
                                    value={newPart.name}
                                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[14px] font-mono"
                                    placeholder="Parça Kodu (P/N)"
                                    value={newPart.id}
                                    onChange={e => setNewPart({ ...newPart, id: e.target.value })}
                                />
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 appearance-none text-[14px]"
                                        value={newPart.category}
                                        onChange={e => setNewPart({ ...newPart, category: e.target.value })}
                                    >
                                        <option>iPhone</option><option>Mac</option><option>iPad</option><option>Aksesuar</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] text-gray-500 font-medium tracking-wide">Stok Adedi</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-[14px]"
                                        value={newPart.quantity === 0 ? '' : newPart.quantity}
                                        onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] text-gray-500 font-medium tracking-wide">Kritik Seviye</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-[14px]"
                                        value={newPart.minLevel === 0 ? '' : newPart.minLevel}
                                        onChange={e => setNewPart({ ...newPart, minLevel: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] text-gray-500 font-medium tracking-wide">Birim Fiyat (TL)</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-[14px]"
                                        value={newPart.price === 0 ? '' : newPart.price}
                                        onChange={e => setNewPart({ ...newPart, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100/50 p-1 flex">
                                    <button type="button" onClick={() => setNewPart({...newPart, warehouseType: 'KGB'})} className={`flex-1 rounded-md text-[12px] font-medium transition-all ${newPart.warehouseType === 'KGB' ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>KGB (Yeni)</button>
                                    <button type="button" onClick={() => setNewPart({...newPart, warehouseType: 'KBB'})} className={`flex-1 rounded-md text-[12px] font-medium transition-all ${newPart.warehouseType === 'KBB' ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>KBB (İade)</button>
                                </div>
                            </div>

                            {hasPermission(currentUser, 'view_all_stores') && (
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 appearance-none text-[14px] text-gray-700"
                                        value={newPart.storeId || ''}
                                        onChange={e => setNewPart({ ...newPart, storeId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Mağaza Seçiniz...</option>
                                        {servicePoints.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-[13px] font-medium shadow-sm transition-all"
                            >
                                Ekle
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transfer Modal */}
            {transferPart && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-2xl w-full max-w-[440px] shadow-2xl p-6 ring-1 ring-black/5 animate-scale-up">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-[17px] font-semibold text-gray-900">Transfer Et</h3>
                            <button onClick={() => { setTransferPart(null); setSelectedSerialsToTransfer([]); }} className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-gray-500"><X size={16} /></button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-medium text-gray-900">{transferPart.name}</p>
                                <p className="text-[12px] text-gray-500 font-mono mt-0.5">{transferPart.partNumber || transferPart.id}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{transferPart.warehouseType || 'KGB'}</span>
                            </div>
                        </div>

                        {((transferPart.warehouseType === 'KGB' && transferPart.kgbSerials?.length > 0) || (transferPart.warehouseType === 'KBB' && transferPart.kbbSerials?.length > 0)) ? (
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <p className="text-[12px] font-medium text-gray-500">Transfer Edilecek Seriler</p>
                                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selectedSerialsToTransfer.length} Seçildi</span>
                                </div>
                                <div className="max-h-36 overflow-y-auto override-scrollbar border border-gray-200/60 rounded-xl bg-white p-2 space-y-1 shadow-inner">
                                    {(transferPart.warehouseType === 'KGB' ? transferPart.kgbSerials : transferPart.kbbSerials).map(serial => (
                                        <label key={serial} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all select-none">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                checked={selectedSerialsToTransfer.includes(serial)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSerialsToTransfer(prev => [...prev, serial]);
                                                    else setSelectedSerialsToTransfer(prev => prev.filter(s => s !== serial));
                                                }}
                                            />
                                            <span className="text-[13px] font-mono font-medium text-gray-800">{serial}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-5 bg-yellow-50 border border-yellow-100 p-3 rounded-xl flex gap-3 items-start">
                                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-yellow-800 font-medium leading-relaxed">Bu parçaya ait kayıtlı seri numarası bulunmuyor. Sadece envanter adres kaydı hedef mağazaya taşınacaktır.</p>
                            </div>
                        )}

                        <p className="text-[12px] font-medium text-gray-500 mb-2 px-1">Hedef Mağaza:</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto override-scrollbar">
                            {servicePoints.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={async () => {
                                        const hasSerials = (transferPart.warehouseType === 'KGB' && transferPart.kgbSerials?.length > 0) || (transferPart.warehouseType === 'KBB' && transferPart.kbbSerials?.length > 0);
                                        
                                        if (hasSerials && selectedSerialsToTransfer.length === 0) {
                                            showToast('Lütfen transfer edilecek seri numarası seçin', 'error');
                                            return;
                                        }

                                        if (hasSerials) {
                                            const success = await transferInventorySerial(
                                                transferPart._id || transferPart.id,
                                                parseInt(s.id),
                                                selectedSerialsToTransfer,
                                                (transferPart.warehouseType || 'kgb').toLowerCase()
                                            );
                                            if (success) {
                                                showToast(`${selectedSerialsToTransfer.length} seri başarıyla transfer edildi`, 'success');
                                            } else {
                                                showToast('Transfer başarısız oldu', 'error');
                                            }
                                        } else {
                                            await updateInventoryItem(transferPart._id || transferPart.id, { storeId: parseInt(s.id) });
                                            showToast('Adres güncellendi (Seri numarası yok)', 'success');
                                        }
                                        setTransferPart(null);
                                        setSelectedSerialsToTransfer([]);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[13px] transition-all flex items-center justify-between group ${String(s.id) === String(transferPart.storeId) ? 'bg-blue-50 text-blue-600 opacity-60 cursor-default ring-1 ring-blue-100/50' : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm text-gray-700'}`}
                                    disabled={String(s.id) === String(transferPart.storeId)}
                                >
                                    <span className="font-semibold">{s.name}</span>
                                    {String(s.id) === String(transferPart.storeId) ? (
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-100/50 px-2 py-0.5 rounded-full">Mevcut konum</span>
                                    ) : (
                                        <ArrowUpRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-2xl w-full max-w-[360px] shadow-2xl p-6 ring-1 ring-black/5 text-center animate-scale-up">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-[17px] font-semibold text-gray-900 mb-1">Silmeyi Onayla</h3>
                        <p className="text-[13px] text-gray-500 mb-6 px-2">
                            <span className="font-medium text-gray-900">{confirmDelete.name}</span> kalıcı olarak envanterden silinecek.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[14px] font-medium transition-colors">İptal</button>
                            <button 
                                onClick={async () => {
                                    try {
                                        const success = await removeInventoryItem(confirmDelete._id || confirmDelete.id);
                                        if (success) {
                                            showToast('Parça silindi', 'success');
                                        } else {
                                            showToast('Silme hatası', 'error');
                                        }
                                    } catch (err) {
                                        showToast('Sunucu hatası', 'error');
                                    }
                                    setConfirmDelete(null);
                                }} 
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
