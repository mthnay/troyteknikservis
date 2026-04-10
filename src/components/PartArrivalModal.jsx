import React, { useState, useEffect } from 'react';
import { X, Save, Box, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const PartArrivalModal = ({ repairId, onClose }) => {
    const { repairs, updateRepair, showToast } = useAppContext();
    const [repair, setRepair] = useState(null);
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const found = repairs.find(r => r.id === repairId);
        if (found) {
            setRepair(found);
            const orderParts = (found.parts || []).map(p => ({
                ...p,
                tempKgb: p.kgbSerial || ''
            }));
            setParts(orderParts);
        }
    }, [repairId, repairs]);

    const handleUpdatePart = (index, value) => {
        const newParts = [...parts];
        newParts[index].tempKgb = value.toUpperCase().replace(/\s/g, '');
        setParts(newParts);
    };

    const handleSave = async () => {
        const incomplete = parts.find(p => p.needsOrder && !p.tempKgb.trim());
        if (incomplete) {
            showToast(`${incomplete.description} için seri no girilmedi.`, 'warning');
            return;
        }

        setLoading(true);
        try {
            const finalParts = parts.map(p => ({
                ...p,
                kgbSerial: p.tempKgb,
                needsOrder: false
            }));

            await updateRepair(repairId, {
                parts: finalParts,
                status: 'Onarımda',
                historyNote: 'Parçalar ulaştı, seri numaraları tanımlandı.'
            });

            showToast('Kaydedildi.', 'success');
            onClose();
        } catch (error) {
            showToast('Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!repair) return null;
    const pendingParts = parts.filter(p => p.needsOrder);

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-lg">
                
                <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Box size={20} />
                        <h2 className="text-lg font-black uppercase tracking-tight">KGB Seri Girişi</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                    {pendingParts.map((part, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic font-medium">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black text-gray-700">{part.description}</span>
                                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-black">{part.partNumber}</span>
                            </div>
                            <input 
                                type="text"
                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-xl text-xs font-black font-mono text-indigo-900 outline-none focus:border-indigo-500 uppercase"
                                placeholder="Yeni Seri No Okutun"
                                value={part.tempKgb}
                                onChange={(e) => handleUpdatePart(parts.findIndex(p => p === part), e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl">İptal</button>
                    <button onClick={handleSave} disabled={loading} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                        {loading ? '...' : <Save size={16} />} KAYDET VE DEVAM ET
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartArrivalModal;
