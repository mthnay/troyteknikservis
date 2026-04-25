import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X, MapPin, CheckCircle, Tag, Calendar, User } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';

const DeliveryFormPrint = ({ repair, signature, onClose }) => {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Teslimat_Formu_${repair?.id}`,
        onAfterPrint: () => onClose()
    });

    if (!repair) return null;

    const REPAIR_TYPE_LABELS = {
        'carry-in': 'Bizzat Teslim (Mağaza İçi)',
        'returnbefore': 'Değiştirmeden Önce İade',
        'mail-in': 'Bütün Birim Posta (Apple Merkezi)',
        'approval': 'Müşteri Onayı Bekleyen (Teklifli)',
        'service': 'Onarım Olmayan Servis',
        'direct-return': 'İşlemsiz İade'
    };

    const isReturned = repair.status?.includes('İade') || repair.repairClosingNote?.includes('İŞLEMSİZ İADE');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto flex flex-col no-print-scrollbar">

                {/* Ön İzleme Alanı */}
                <div ref={componentRef} className="print-container bg-white text-black font-sans leading-normal">

                    {/* SAYFA 1: TESLİMAT VE İŞLEM DETAYLARI */}
                    <div className="p-10 min-h-[1100px] flex flex-col page-break bg-white">
                        
                        {/* 1. Üst Bilgi / Header */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-xl font-bold text-3xl">
                                    T
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight">TROY TEKNİK SERVİS</h1>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Yetkili Servis Sağlayıcısı</p>
                                    <div className="mt-1 text-[9px] text-gray-500 leading-tight uppercase font-medium">
                                        <p>ARTIBİLGİ TEKNOLOJİ BİLİŞİM VE DIŞ TİC. A.Ş.</p>
                                        <p>Bağdat Caddesi No:123, Kadıköy / İstanbul</p>
                                        <p>Tel: 0216 123 45 67 | Web: www.artitroy.com</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <h2 className={`text-xl font-black uppercase mb-1 ${isReturned ? 'text-orange-600' : 'text-green-600'}`}>
                                    {isReturned ? 'Cihaz İade Formu' : 'Servis Teslim Formu'}
                                </h2>
                                <div className="bg-black text-white px-3 py-1 text-sm font-mono font-bold rounded mb-2">#{repair.id}-OUT</div>
                                <div className="text-[10px] font-bold text-gray-600">
                                    <p>Teslim Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                                    <p>Kayıt Tarihi: {new Date(repair.createdAt).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Bilgi Özet Alanı */}
                        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-6 font-sans text-xs">
                            <div className="bg-white p-4">
                                <h3 className="text-[10px] font-black uppercase bg-gray-100 p-1 mb-3 border-l-4 border-black">Müşteri Bilgileri</h3>
                                <div className="space-y-1.5">
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">Ad Soyad:</span> <span className="font-bold">{repair.customer}</span></p>
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">Telefon:</span> {repair.customerPhone}</p>
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">TC/VKN:</span> {repair.tcNo || '-'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4">
                                <h3 className="text-[10px] font-black uppercase bg-gray-100 p-1 mb-3 border-l-4 border-black">Cihaz Bilgileri</h3>
                                <div className="space-y-1.5">
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">Model:</span> <span className="font-bold">{repair.device}</span></p>
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">Seri No:</span> <span className="font-mono">{repair.serialNumber || repair.serial}</span></p>
                                    <p><span className="font-bold text-gray-500 w-20 inline-block">Durum:</span> {repair.warrantyStatus || 'Garanti Dışı'}</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Uygulanan İşlemler */}
                        <div className="border border-gray-200 mb-6">
                            <h3 className="text-[10px] font-black uppercase bg-gray-100 p-2 border-b border-gray-200">Teknik Servis İşlem Detayları</h3>
                            <div className="p-5 space-y-5">
                                {repair.repairClosingNote && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Yapılan İşlemler:</p>
                                        <div className="text-[13px] font-bold text-gray-900 border border-gray-100 p-4 bg-gray-50 rounded whitespace-pre-wrap leading-relaxed">
                                            {repair.repairClosingNote.replace(/\n\n\[İşlem Süresi: .*\]$/, '')}
                                        </div>
                                    </div>
                                )}
                                
                                {repair.parts && repair.parts.length > 0 && !isReturned && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Değişen Orijinal Parçalar:</p>
                                        <table className="w-full text-left text-[10px] border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 p-2 font-black">Parça Tanımı</th>
                                                    <th className="border border-gray-200 p-2 font-black">Parça No</th>
                                                    <th className="border border-gray-200 p-2 font-black">Yeni Seri No</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {repair.parts.map((part, index) => (
                                                    <tr key={index}>
                                                        <td className="border border-gray-200 p-2 font-medium uppercase">{part.description}</td>
                                                        <td className="border border-gray-200 p-2 font-mono uppercase">{part.partNumber || '-'}</td>
                                                        <td className="border border-gray-200 p-2 font-mono uppercase font-bold">{part.kgbSerial || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Tahsilat Bilgisi */}
                        <div className="border-2 border-black p-4 mb-8 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase mb-1">Tahsilat Detayı</h3>
                                <p className="text-[9px] text-gray-500 uppercase font-bold">
                                    {isReturned ? 'Cihaz işlemsiz iade edilmiştir.' : 'Onarım bedeli karşılıklı mutabık kalınarak tahsil edilmiştir.'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Toplam Tutar</span>
                                <span className="text-3xl font-black">
                                    {(repair.quoteAmount || repair.cost) > 0 
                                        ? `${parseFloat(repair.quoteAmount || repair.cost).toLocaleString('tr-TR')} ₺` 
                                        : '0,00 ₺ (Garanti)'}
                                </span>
                            </div>
                        </div>

                        {/* 5. Önemli Hatırlatmalar */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="p-3 border border-gray-200 rounded text-[9px] leading-tight bg-gray-50/50">
                                <h4 className="font-bold mb-1 border-b border-gray-100 pb-1 uppercase italic text-blue-600">Garanti Bilgilendirmesi</h4>
                                <p>Değiştirilen parçalar, teslim tarihinden itibaren kullanıcı hatası (darbe, sıvı temas vb.) olmaksızın 90 (doksan) gün Troy Teknik Servis garantisi altındadır. Garanti takibi seri numarası üzerinden yapılmaktadır.</p>
                            </div>
                            <div className="p-3 border border-gray-200 rounded text-[9px] leading-tight bg-gray-50/50">
                                <h4 className="font-bold mb-1 border-b border-gray-100 pb-1 uppercase italic text-blue-600">Teknik Not</h4>
                                <p>Cihazınızın fabrika çıkışındaki sıvı direnci (IP sertifikası) servis müdahalesi sonrası garanti edilemez. Cihazınızı sıvı ile temas ettirmemenizi öneririz.</p>
                            </div>
                        </div>

                        {/* 6. İmza Alanları */}
                        <div className="mt-auto grid grid-cols-2 border border-gray-200 h-32 font-sans">
                            <div className="border-r border-gray-200 p-3 relative flex flex-col justify-between text-center">
                                <span className="text-[9px] font-black uppercase text-gray-400">Servis Yetkilisi (Kaşe/İmza)</span>
                                <div className="pb-2">
                                    <p className="text-[10px] font-bold text-gray-800 uppercase">TROY TEKNİK SERVİS</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter">İşlem Onaylanmıştır</p>
                                </div>
                            </div>
                            <div className="p-3 relative flex flex-col justify-between group text-center">
                                <span className="text-[9px] font-black uppercase text-gray-400">Müşteri Beyanı (Ad-Soyad/İmza)</span>
                                <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
                                    {signature && (
                                        <img src={signature} alt="İmza" className="max-h-20 object-contain mix-blend-multiply" />
                                    )}
                                </div>
                                <div className="pb-2 z-10">
                                    <p className="text-[10px] font-bold text-gray-800 uppercase">{repair.customer}</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter">Cihazımı Eksiksiz ve Çalışır Vaziyette Teslim Aldım</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center text-[8px] text-gray-400 uppercase font-bold tracking-widest border-t border-gray-100 pt-2">
                            <span>TROY TEKNİK SERVİS | TESLİMAT BELGESİ</span>
                            <span>Sayfa 1 / 1</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-gray-900 flex justify-between items-center no-print">
                    <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em]">
                        PREMIUM DELIVERY DOC v2.0<br />
                        OUT-ID: {repair.id}
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-white/60 hover:text-white rounded-xl text-sm font-bold transition-all">İptal</button>
                        <button onClick={handlePrint} className="px-8 py-3 bg-white text-black hover:bg-gray-100 rounded-xl text-sm font-black shadow-lg transition-all flex items-center gap-2">
                            <Printer size={18} /> FORMALARI YAZDIR (A4)
                        </button>
                    </div>
                </div>
            </div >

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; }
                    .print-container { width: 100% !important; margin: 0 !important; border: none !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    .page-break-before { page-break-before: always; }
                }
                .no-print-scrollbar::-webkit-scrollbar { display: none; }
                .print-container * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            `}</style>
        </div >
    );
};

export default DeliveryFormPrint;
