import React, { useState, useMemo, useEffect } from 'react';
import { Package, Search, Plus, Filter, ArrowUpRight, ArrowDownRight, Tag, Recycle, Box, Clock, AlertCircle, Truck, CheckCircle, Trash2, Edit3, X, ChevronRight, ArrowRightLeft } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';
import { appAlert } from '../utils/alert';
import { appConfirm, appPrompt } from '../utils/alert';
import { hasPermission } from '../utils/permissions';

const KBBManagement = () => {
    const { repairs, updateRepair, showToast, currentUser, servicePoints, inventory, updateInventoryItem, addInventoryItem, removeInventoryItem } = useAppContext();
    
    // Debugging current role
    useEffect(() => {
        if (currentUser) {
            console.log("KBBManagement - Current User Role:", currentUser.role);
        }
    }, [currentUser]);

    const [activeTab, setActiveTab] = useState('parts'); // 'parts', 'loaners', 'returns'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showAddPartModal, setShowAddPartModal] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [returnCode, setReturnCode] = useState('');
    const [editingSerialIdx, setEditingSerialIdx] = useState(-1);
    const [editingSerialVal, setEditingSerialVal] = useState('');
    const [showEditSerialModal, setShowEditSerialModal] = useState(false);

    // Form State for Add Part
    const [newPart, setNewPart] = useState({
        partNumber: '',
        name: '',
        category: 'parts'
    });
    const [serialList, setSerialList] = useState([]);
    const [currentSerial, setCurrentSerial] = useState('');

    // --- Helpers ---
    const getDaysLeft = (dateStr) => {
        if (!dateStr) return 0;
        const [day, month, year] = dateStr.split(' ')[0].split('.');
        if (!day || !month || !year) return 0;
        const target = new Date(year, month - 1, day);
        target.setDate(target.getDate() + 90); 
        return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
    };

    const getShipTo = (sId) => servicePoints.find(p => p.id === sId)?.shipTo || '-';

    // Optimize KBB list derivation
    const kbbList = useMemo(() => {
        return repairs.flatMap(repair =>
            (repair.parts || []).map((part, index) => ({
                ...part,
                uniqueId: `${repair.id}-${index}`,
                repairId: repair.id,
                storeId: repair.storeId,
                repairTarih: repair.date,
                customer: repair.customer,
                partIndex: index,
                kbbStatus: part.kbbStatus || 'Bekliyor',
                returnCode: part.returnCode || ''
            }))
        ).filter(item => item.kbbStatus !== 'Returned');
    }, [repairs]);

    // Optimize filtering
    const filteredItems = useMemo(() => {
        return kbbList.filter(item =>
            (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.repairId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.partNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [kbbList, searchTerm]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(filteredItems.map(i => i.uniqueId));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(i => i !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleBulkReturn = async () => {
        if (!returnCode) {
            showToast('Lütfen İade Talep Kodu giriniz.', 'warning');
            return;
        }

        const itemsToReturn = kbbList.filter(item => selectedItems.includes(item.uniqueId));

        // Group by repair ID to minimize API calls (batch updates per repair)
        const repairsToUpdate = {};

        itemsToReturn.forEach(item => {
            if (!repairsToUpdate[item.repairId]) {
                repairsToUpdate[item.repairId] = [];
            }
            repairsToUpdate[item.repairId].push(item);
        });

        // Perform updates
        for (const [repairId, items] of Object.entries(repairsToUpdate)) {
            const repair = repairs.find(r => r.id === repairId);
            if (!repair) continue;

            const updatedParts = [...repair.parts];
            items.forEach(item => {
                updatedParts[item.partIndex] = {
                    ...updatedParts[item.partIndex],
                    kbbStatus: 'Returned',
                    returnCode: returnCode,
                    returnTarih: new Date().toLocaleString('tr-TR')
                };
            });

            await updateRepair(repairId, { parts: updatedParts });
        }

        showToast(`${itemsToReturn.length} parça başarıyla iade edildi ve arşive taşındı.`, 'success');
        setShowReturnModal(false);
        setReturnCode('');
        setSelectedItems([]);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-md text-indigo-600 border border-indigo-100 shadow-sm">
                        <Box size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Stok & KBB Yönetimi</h2>
                        <p className="text-gray-500 mt-1 font-medium">Yedek parça stoklarını ve iade (KBB) süreçlerini takip edin.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setActiveTab('stocks')}
                            className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'stocks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Stok Listesi
                        </button>
                        <button
                            onClick={() => setActiveTab('returns')}
                            className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'returns' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            İade Havuzu (KBB)
                        </button>
                    </div>
                </div>
            </div>

            {/* İstatistik Kartları - Ana Sayfa Stili */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'TOPLAM PARÇA', value: inventory.length, icon: Package, color: 'text-gray-400', bg: 'bg-white', iconBg: 'bg-gray-50' },
                    { label: 'BEKLEYEN İADE', value: kbbList.length, icon: ArrowRightLeft, color: 'text-indigo-500', bg: 'bg-white', iconBg: 'bg-indigo-50' },
                    { label: 'KRİTİK STOK', value: inventory.filter(s => s.quantity < 3).length, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-white', iconBg: 'bg-orange-50' },
                    { label: 'BUGÜN GELEN', value: '12', icon: Clock, color: 'text-green-500', bg: 'bg-white', iconBg: 'bg-green-50' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 ${stat.iconBg} rounded-md flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* İçerik Alanı - Ana Sayfa Stili */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'returns' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <th className="px-6 py-4">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedItems.length === filteredItems.length && filteredItems.length > 0} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    </th>
                                    <th className="px-6 py-4">Geri Gönderilecek Parça</th>
                                    <th className="px-6 py-4">Servis / Müşteri</th>
                                    <th className="px-6 py-4 text-center">Kalan Gün</th>
                                    <th className="px-6 py-4 text-center">Şube</th>
                                    <th className="px-6 py-4 text-center">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.uniqueId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(item.uniqueId)} 
                                                    onChange={() => handleSelectItem(item.uniqueId)} 
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-tight">{item.partNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 w-fit mb-1">#{item.repairId}</span>
                                                    <span className="text-xs font-medium text-gray-500">{item.customer}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[11px] font-bold ${getDaysLeft(item.repairTarih) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {getDaysLeft(item.repairTarih)} Gün
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-bold text-gray-500">{getShipTo(item.storeId)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.kbbStatus === 'Shipped' ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wide border border-blue-200">Kargoda</span>
                                                        <span className="text-[9px] font-mono text-gray-500 mt-1 font-bold">{item.trackingNo}</span>
                                                    </div>
                                                ) : item.kbbStatus === 'Delivered' ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wide border border-green-200">Teslim Edildi</span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-orange-200 uppercase tracking-wide">
                                                        {item.kbbStatus}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {item.kbbStatus === 'Bekliyor' && (
                                                        <button 
                                                            onClick={async () => {
                                                                const tracking = await appPrompt('Lütfen UPS/Aras Takip Numarasını giriniz:');
                                                                if (tracking) {
                                                                    const repair = repairs.find(r => r.id === item.repairId);
                                                                    const updatedParts = [...repair.parts];
                                                                    updatedParts[item.partIndex] = {
                                                                        ...updatedParts[item.partIndex],
                                                                        kbbStatus: 'Shipped',
                                                                        trackingNo: tracking,
                                                                        shippedTarih: new Date().toLocaleString('tr-TR')
                                                                    };
                                                                    updateRepair(item.repairId, { parts: updatedParts });
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" 
                                                            title="Kargola"
                                                        >
                                                            <Truck size={14} />
                                                        </button>
                                                    )}

                                                    {item.kbbStatus === 'Shipped' && (
                                                        <button 
                                                            onClick={() => {
                                                                const repair = repairs.find(r => r.id === item.repairId);
                                                                const updatedParts = [...repair.parts];
                                                                updatedParts[item.partIndex] = {
                                                                    ...updatedParts[item.partIndex],
                                                                    kbbStatus: 'Delivered',
                                                                    deliveredTarih: new Date().toLocaleString('tr-TR')
                                                                };
                                                                updateRepair(item.repairId, { parts: updatedParts });
                                                                showToast('Parça teslim edildi olarak işaretlendi.', 'success');
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm" 
                                                            title="Teslim Edildi Onayla"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-gray-400 font-medium uppercase tracking-widest text-[10px]">İade bekleyen parça bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    ) : activeTab === 'parts' ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] font-semibold text-xs uppercase tracking-wide text-gray-400">
                                <tr>
                                    <th className="px-8 py-4">BİLGİ</th>
                                    <th className="px-4 py-4">P/N KODU</th>
                                    <th className="px-4 py-4 text-center">STOK SEVİYESİ</th>
                                    <th className="px-8 py-4 text-right">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory.filter(i => i.category !== 'loaner').length > 0 ? (
                                    inventory.filter(i => i.category !== 'loaner').map((item) => (
                                        <tr key={item._id || item.id} onClick={() => setSelectedStockItem(item)} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex flex-shrink-0 items-center justify-center">
                                                        <Package size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{item.name}</span>
                                                        <div className="text-[11px] text-gray-400 font-medium">{item.category || 'Yedek Parça'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-mono text-xs text-gray-500 font-bold">{item.partNumber || '-'}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[13px] font-semibold mb-1 ${item.quantity <= (item.minLevel || 5) ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity} Adet</span>
                                                    <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all ${item.quantity <= (item.minLevel || 5) ? 'bg-red-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${Math.min((item.quantity / (item.maxLevel || 100)) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedStockItem(item); }}
                                                        className="h-8 px-3 flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                    >
                                                        Detay
                                                    </button>
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const confirmed = await appConfirm(`<strong>${item.name}</strong> envanterden tamamen silinecek. Emin misiniz?`);
                                                            if (confirmed) {
                                                                removeInventoryItem(item._id || item.id);
                                                                showToast('Parça envanterden silindi.', 'info');
                                                            }
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-16 text-gray-400 font-medium">Envanterde parça bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    ) : (
                        // Loaners Tab
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inventory.filter(i => i.category === 'loaner').map((item) => (
                                <div key={item.id} className="bg-white rounded-lg p-6 border border-gray-100 shadow-xl hover:translate-y-[-4px] transition-all group relative overflow-hidden">
                                     {item.currentCustomer && (
                                         <div className="absolute top-0 right-0 p-1">
                                             <span className="bg-amber-500 text-white text-[8px] font-semibold uppercase px-2 py-1 rounded-bl-xl shadow-sm">Kullanımda</span>
                                         </div>
                                     )}
                                     <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${item.currentCustomer ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <MyPhoneIcon size={22} />
                                        </div>
                                        {!item.currentCustomer && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full text-[9px] font-semibold uppercase">Müsait</span>}
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                                    <p className="text-[10px] font-mono text-gray-400 mb-4">S/N: {item.serialNumber}</p>

                                    {item.currentCustomer ? (
                                        <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-100">
                                            <p className="text-[9px] font-semibold text-purple-400 text-xs uppercase tracking-wide mb-1">Şu an Kimde?</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-purple-900">{item.currentCustomer}</p>
                                                <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-1"><Clock size={10}/> 4 Gün</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => appAlert('Cihaz atama modülü yakında açılacak.', 'info')} className="mt-4 w-full py-2 bg-gray-900 text-white text-[10px] font-semibold text-xs uppercase tracking-wide rounded-md hover:bg-black transition-all">Müşteriye Ver</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>


            {/* Add Part Modal */}
            {showAddPartModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg p-8 shadow-2xl animate-scale-up border border-white/50 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Yeni Stok Girişi</h3>
                                    <p className="text-xs text-gray-500 font-medium">Yedek parça ve KBB seri numarası ekleme.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddPartModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-widest">Parça Kodu (P/N)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all uppercase"
                                        placeholder="661-00000"
                                        value={newPart.partNumber}
                                        onChange={(e) => setNewPart({...newPart, partNumber: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-widest">Parça Tanımı</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        placeholder="iPhone 13 Screen"
                                        value={newPart.name}
                                        onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                                    />
                                </div>
                             </div>

                             <div className="space-y-4">
                                <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-widest flex justify-between">
                                    KBB Seri Numaraları (Zorunlu)
                                    <span className="text-blue-500 text-[9px]">{serialList.length} Adet</span>
                                </label>
                                
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all uppercase"
                                        placeholder="KBB Seri No Giriniz..."
                                        value={currentSerial}
                                        onChange={(e) => setCurrentSerial(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (currentSerial.trim()) {
                                                    setSerialList([...serialList, currentSerial.trim().toUpperCase()]);
                                                    setCurrentSerial('');
                                                }
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            if (currentSerial.trim()) {
                                                setSerialList([...serialList, currentSerial.trim().toUpperCase()]);
                                                setCurrentSerial('');
                                            }
                                        }}
                                        className="w-14 h-14 bg-gray-900 text-white rounded-md flex items-center justify-center hover:bg-black transition-all shadow-lg"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {serialList.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-md animate-scale-up">
                                            <span className="text-[11px] font-semibold text-blue-900 font-mono tracking-tighter">{s}</span>
                                            <button 
                                                onClick={() => setSerialList(serialList.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {serialList.length === 0 && (
                                        <div className="py-8 border-2 border-dashed border-gray-100 rounded-md flex flex-col items-center justify-center text-gray-400">
                                            <Tag size={24} className="mb-2 opacity-20" />
                                            <p className="text-[10px] font-bold text-xs uppercase tracking-wide opacity-40">Henüz seri no eklenmedi</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] text-gray-400">Not: Her girdiğiniz seri numarası için ayrı bir alan oluşur. Enter tuşu ile hızlıca ekleyebilirsiniz.</p>
                             </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddPartModal(false)}
                                className="flex-1 py-4 rounded-md font-bold text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={async () => {
                                    if (!newPart.partNumber || !newPart.name || serialList.length === 0) {
                                        showToast('Lütfen tüm alanları doldurun ve en az bir seri no ekleyin.', 'warning');
                                        return;
                                    }

                                    const itemToSave = {
                                        ...newPart,
                                        quantity: serialList.length,
                                        kbbSerials: serialList,
                                        minLevel: 5,
                                        maxLevel: 100,
                                        id: `item-${Date.now()}`
                                    };

                                    await addInventoryItem(itemToSave);
                                    showToast('Parçalar envantere kaydedildi.', 'success');
                                    setShowAddPartModal(false);
                                    setNewPart({ partNumber: '', name: '', category: 'parts' });
                                    setSerialList([]);
                                    setCurrentSerial('');
                                }}
                                className="flex-1 py-4 rounded-md font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Stoğa Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Detail Modal (Logistics View) */}
            {selectedStockItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-8 shadow-2xl animate-scale-up border border-white/50 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Box size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-xl font-semibold text-gray-900">{selectedStockItem.name}</h3>
                                        <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border border-blue-100">Lojistik Görünümü</span>
                                    </div>
                                    <p className="text-sm font-mono text-gray-400 font-bold uppercase">P/N: {selectedStockItem.partNumber}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStockItem(null)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-6">
                                <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100">
                                    <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-widest mb-4">Sistem Durumu</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500">Mevcut Stok</span>
                                            <span className="text-2xl font-semibold text-gray-900">{selectedStockItem.quantity} Adet</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500">Kritik Seviye</span>
                                            <span className="text-sm font-semibold text-red-500">{selectedStockItem.minLevel || 5} Adet</span>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200/50">
                                             <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all ${selectedStockItem.quantity <= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min((selectedStockItem.quantity / 20) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/30 p-6 rounded-lg border border-blue-100/50">
                                    <h4 className="text-xs font-semibold uppercase text-blue-900 tracking-widest mb-3 flex items-center gap-2">
                                        <AlertCircle size={14} /> Apple KBB Politikası
                                    </h4>
                                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">Bu parçaya ait KBB seri numaraları Apple GSX sistemi üzerinden takip edilmelidir. Her bir seri no iade sürecinde kritik öneme sahiptir.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-widest">Kayıtlı KBB Seri Numaraları</p>
                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(selectedStockItem.kbbSerials || []).length > 0 ? (
                                        selectedStockItem.kbbSerials.map((s, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-md shadow-sm hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center text-[10px] font-semibold group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-xs font-semibold font-mono text-gray-700 tracking-tight">{s}</span>
                                                </div>
                                                
                                                {/* Admin Only Actions */}
                                                {hasPermission(currentUser, 'manage_settings') && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingSerialIdx(idx);
                                                                setEditingSerialVal(s);
                                                                setShowEditSerialModal(true);
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                                                            title="Düzenle"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const confirmed = await appConfirm(`<strong>${s}</strong> seri numarasını silmek istediğinize emin misiniz?`);
                                                                if (confirmed) {
                                                                    const updatedSerials = selectedStockItem.kbbSerials.filter((_, i) => i !== idx);
                                                                    const updatedItem = { 
                                                                        ...selectedStockItem, 
                                                                        kbbSerials: updatedSerials,
                                                                        quantity: (selectedStockItem.quantity || 1) - 1 
                                                                    };
                                            await updateInventoryItem(selectedStockItem._id || selectedStockItem.id, updatedItem);
                                                                    setSelectedStockItem(updatedItem);
                                                                    showToast('Seri no silindi.', 'info');
                                                                }
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-md hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                                                            title="Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                {!hasPermission(currentUser, 'manage_settings') && <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-all" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-xs text-gray-400 font-bold uppercase italic">Seri No Kaydı Bulunamadı</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={() => setSelectedStockItem(null)}
                                className="flex-1 py-4 bg-gray-900 text-white rounded-md font-semibold text-xs uppercase tracking-wide text-[11px] hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                Pencereyi Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Serial Modal (Premium Context) */}
            {showEditSerialModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-hidden">
                    <div className="bg-white rounded-lg w-full max-w-md p-10 shadow-2xl animate-scale-up border border-white/20 relative">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-lg flex items-center justify-center shadow-xl shadow-blue-500/30 mb-6 group hover:rotate-6 transition-all">
                                <Edit3 size={28} />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Seri No Düzenle</h3>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                Lütfen <span className="text-blue-600 font-semibold">{selectedStockItem?.name}</span> için <br/>yeni seri numarasını aşağıya giriniz.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase text-gray-400 tracking-[0.2em] ml-2">Yeni Seri Numarası</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Tag className="text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={18} />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text"
                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-lg text-lg font-semibold font-mono tracking-wider text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50 transition-all outline-none uppercase"
                                        placeholder="KBB00000000"
                                        value={editingSerialVal}
                                        onChange={(e) => setEditingSerialVal(e.target.value.toUpperCase())}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && editingSerialVal.trim()) {
                                                const updatedSerials = [...selectedStockItem.kbbSerials];
                                                updatedSerials[editingSerialIdx] = editingSerialVal.trim();
                                                const updatedItem = { ...selectedStockItem, kbbSerials: updatedSerials };
                                                await updateInventoryItem(selectedStockItem._id || selectedStockItem.id, updatedItem);
                                                setSelectedStockItem(updatedItem);
                                                setShowEditSerialModal(false);
                                                showToast('Seri no başarıyla güncellendi.', 'success');
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowEditSerialModal(false)}
                                    className="flex-1 py-5 rounded-[22px] font-semibold text-xs uppercase tracking-wide text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={async () => {
                                        if (editingSerialVal.trim()) {
                                            const updatedSerials = [...selectedStockItem.kbbSerials];
                                            updatedSerials[editingSerialIdx] = editingSerialVal.trim();
                                            const updatedItem = { ...selectedStockItem, kbbSerials: updatedSerials };
                                            await updateInventoryItem(selectedStockItem._id || selectedStockItem.id, updatedItem);
                                            setSelectedStockItem(updatedItem);
                                            setShowEditSerialModal(false);
                                            showToast('Seri no başarıyla güncellendi.', 'success');
                                        }
                                    }}
                                    className="flex-[1.5] py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[22px] font-semibold text-xs uppercase tracking-wide text-[11px] shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Değişiklikleri Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-8 shadow-2xl animate-scale-up border border-white/50">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Toplu İade İşlemi</h3>
                        <p className="text-sm text-gray-500 mb-6">Seçilen {selectedItems.length} adet parça için iade talep kodunu giriniz.</p>

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-widest">İade Talep Kodu</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md text-lg font-mono font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none uppercase transition-all"
                                placeholder="REQ-00000"
                                value={returnCode}
                                onChange={(e) => setReturnCode(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="flex-1 py-3.5 rounded-md font-bold text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleBulkReturn}
                                className="flex-1 py-3.5 rounded-md font-bold text-white bg-gray-900 hover:bg-black transition-all shadow-lg shadow-gray-200"
                            >
                                İadeyi Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KBBManagement;
