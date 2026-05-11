import React, { useState } from 'react';
import { X, Download, FileText, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { appAlert } from '../utils/alert';
import html2pdf from 'html2pdf.js';
import DeliveryFormPrint from './DeliveryFormPrint';

const BatchExportModal = ({ onClose }) => {
    const { repairs } = useAppContext();
    const [repairIdsInput, setRepairIdsInput] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errors, setErrors] = useState([]);
    const [foundRepairs, setFoundRepairs] = useState([]);

    const handleExport = async () => {
        const ids = repairIdsInput.split(/[\s,]+/).filter(id => id.trim() !== '');
        if (ids.length === 0) {
            appAlert('Lütfen en az bir kayıt numarası giriniz.', 'warning');
            return;
        }

        setIsExporting(true);
        setErrors([]);
        setProgress({ current: 0, total: ids.length });

        const toExport = [];
        const missing = [];

        ids.forEach(id => {
            // Try matching original ID or repairId property
            const cleanId = id.trim().replace('#', '');
            const found = repairs.find(r => 
                String(r.id) === cleanId || 
                String(r.repairId) === cleanId ||
                (r.id && String(r.id).toLowerCase() === cleanId.toLowerCase())
            );

            if (found) {
                toExport.push(found);
            } else {
                missing.push(id);
            }
        });

        if (missing.length > 0) {
            setErrors(prev => [...prev, `Bulunamayan Kayıtlar: ${missing.join(', ')}`]);
        }

        if (toExport.length === 0) {
            setIsExporting(false);
            return;
        }

        setFoundRepairs(toExport);
        
        // Modalın DOM'a rendering için zaman tanı
        setTimeout(async () => {
            for (let i = 0; i < toExport.length; i++) {
                const repair = toExport[i];
                const element = document.getElementById(`print-export-${repair.id}`);
                
                if (element) {
                    setProgress({ current: i + 1, total: toExport.length });
                    
                    const opt = {
                        margin: 0,
                        filename: `Servis_Cikis_Formu_${repair.id}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };

                    try {
                        await html2pdf().set(opt).from(element).save();
                        // Browser download limitlerini aşmamak için küçük bir bekleme
                        await new Promise(resolve => setTimeout(resolve, 800));
                    } catch (err) {
                        console.error('Export error for ID:', repair.id, err);
                        setErrors(prev => [...prev, `#${repair.id} dışa aktarılamadı.`]);
                    }
                }
            }
            setIsExporting(false);
            if (errors.length === 0 && missing.length === 0) {
                appAlert('Tüm dosyalar başarıyla indirildi.', 'success');
                onClose();
            }
        }, 1000);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-lg">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-900 rounded-md flex items-center justify-center text-white shadow-lg">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Toplu Form İndir</h3>
                            <p className="text-xs text-gray-500 font-medium">Servis çıkış formlarını PDF olarak dışa aktar.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-3 pl-1">Servis Kayıt Numaraları</label>
                        <textarea
                            placeholder="Örn: 1001, 1005, 1010 (Virgül veya boşlukla ayırın)"
                            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-lg min-h-[150px] outline-none focus:bg-white focus:border-gray-900 transition-all font-mono text-sm leading-relaxed"
                            value={repairIdsInput}
                            onChange={(e) => setRepairIdsInput(e.target.value)}
                            disabled={isExporting}
                        />
                    </div>

                    {isExporting && (
                        <div className="space-y-3 p-6 bg-blue-50/50 rounded-lg border border-blue-100 animate-pulse">
                            <div className="flex justify-between items-center text-xs font-bold text-blue-700">
                                <div className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    PDF'ler Hazırlanıyor...
                                </div>
                                <span>{progress.current} / {progress.total}</span>
                            </div>
                            <div className="h-2 w-full bg-blue-200/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 transition-all duration-500" 
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-100 space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-[10px] text-xs uppercase tracking-wide">
                                <AlertTriangle size={14} /> Uyarılar
                            </div>
                            <ul className="text-xs font-medium list-disc list-inside opacity-80">
                                {errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 text-gray-500 font-bold hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200"
                        disabled={isExporting}
                    >
                        Vazgeç
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting || !repairIdsInput.trim()}
                        className="flex-[2] py-4 bg-gray-900 text-white font-bold rounded-md shadow-xl shadow-gray-200 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                    >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        İndirmeyi Başlat
                    </button>
                </div>

                {/* Hidden Render for PDF Generation */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    {foundRepairs.map(repair => (
                        <div key={repair.id} id={`print-export-${repair.id}`}>
                            {/* We use a simplified version of DeliveryFormPrint or the component itself with special styles */}
                            <DeliveryFormContainer repair={repair} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Simplified Delivery Form Container for PDF
const DeliveryFormContainer = ({ repair }) => {
    // We basically need the JSX from DeliveryFormPrint without the fixed modal wrapper
    return (
        <div className="bg-white text-gray-900 font-sans p-12" style={{ width: '210mm' }}>
             {/* Sayfa Başlığı */}
             <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-semibold text-3xl">T</div>
                    <div>
                        <h1 className="text-3xl font-semibold text-black uppercase">Troy Servis</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Cihaz Teslim ve Onarım Onay Formu</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-mono font-semibold text-black">#{repair.id}-OUT</h2>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Teslim Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-left">
                <div className="bg-gray-50 p-4 border border-gray-200">
                    <h3 className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Müşteri</h3>
                    <p className="font-bold">{repair.customer}</p>
                    <p className="text-sm">{repair.customerPhone}</p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-200">
                    <h3 className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Cihaz</h3>
                    <p className="font-bold">{repair.device}</p>
                    <p className="text-xs font-mono">{repair.serialNumber || repair.serial || '-'}</p>
                </div>
            </div>

            <div className="border border-gray-200 p-6 mb-8 text-left">
                <h3 className="text-xs font-semibold uppercase mb-4">Uygulanan Teknik İşlemler</h3>
                <p className="text-sm italic text-gray-700 bg-gray-50 p-4 border border-gray-100">
                    {repair.diagnosisNotes || "Onarım işlemleri başarıyla tamamlanmıştır."}
                </p>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-12 pt-8 border-t border-gray-300">
                <div className="text-left">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase mb-4">Teslim Eden</p>
                    <p className="text-xs font-bold uppercase">Troy Teknik Servis</p>
                </div>
                <div className="text-left">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase mb-2">Teslim Alan (Müşteri)</p>
                    <div className="h-16 flex items-center justify-between border-b border-gray-300">
                        <div className="h-full overflow-hidden flex-1">
                            {repair.deliverySignature ? (
                                <img src={repair.deliverySignature} alt="İmza" className="h-full object-contain mix-blend-multiply" />
                            ) : (
                                <div className="h-full flex items-center text-gray-300 text-[10px] italic">Dijital Onay Alınmıştır.</div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase">{repair.customer}</p>
                            <p className="text-[9px] text-gray-400">Teslim Onayı</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="text-[8px] text-gray-400 text-center mt-12 uppercase">Bu belge sistem tarafından otomatik olarak oluşturulmuştur.</p>
        </div>
    );
};

export default BatchExportModal;
