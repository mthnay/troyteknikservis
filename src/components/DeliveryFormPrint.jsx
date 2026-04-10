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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Preview Area */}
                <div ref={componentRef} className="print-container bg-white text-gray-900 font-sans">

                    {/* SAYFA 1: TESLİMAT VE İŞLEM DETAYLARI */}
                    <div className="p-12 min-h-[1100px] flex flex-col page-break">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b-[1px] border-gray-100 pb-10 mb-12">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-[#f5f5f7] text-black flex items-center justify-center rounded-[24px] font-black text-4xl border border-gray-100 shadow-sm">T</div>
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black tracking-tight text-black">TROY SERVİS</h1>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full animate-pulse ${isReturned ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
                                            {isReturned ? 'Cihaz İade ve Teslimat Formu' : 'Onarım Tamamlama ve Teslimat Formu'}
                                        </p>
                                    </div>
                                    <div className="pt-2 text-[10px] text-gray-400 font-medium leading-relaxed max-w-[300px]">
                                        <p className="uppercase">ARTIBİLGİ TEKNOLOJİ BİLİŞİM VE DIŞ TİC. A.Ş.</p>
                                        <p>Bağdat Caddesi No:123, 34728 Kadıköy / İstanbul</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className={`${isReturned ? 'bg-orange-600' : 'bg-green-600'} text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10`}>
                                    {isReturned ? 'İşlemsiz İade' : 'Onarım Tamamlandı'}
                                </div>
                                <div className="flex flex-col items-end">
                                    <h2 className="text-5xl font-mono font-black text-black tracking-tighter">#{repair.id}-OUT</h2>
                                    <div className="h-1.5 w-full bg-green-500 mt-1 rounded-full opacity-20"></div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Teslim: <span className="text-black">{new Date().toLocaleDateString('tr-TR')}</span></p>
                            </div>
                        </div>

                        {/* Bilgi Grid */}
                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2">
                                    <User size={14} /> Müşteri ve İletişim
                                </h3>
                                <div className="space-y-4 pt-2 relative z-10">
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ad Soyad</span>
                                        <span className="text-base font-black text-gray-900">{repair.customer}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Telefon</span>
                                        <span className="text-sm font-black text-gray-900">{repair.customerPhone}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">E-Posta</span>
                                        <span className="text-sm font-bold text-gray-700">{repair.customerEmail || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-6 flex items-center gap-2">
                                    <MyPhoneIcon size={14} /> Cihaz Bilgileri
                                </h3>
                                <div className="space-y-4 pt-2 relative z-10">
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Model</span>
                                        <span className="text-base font-black text-blue-600">{repair.device}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Seri No</span>
                                        <span className="text-sm font-mono font-black tracking-tight text-gray-900 uppercase">{repair.serialNumber || repair.serial || 'Belirtilmedi'}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Garanti</span>
                                        <span className="text-sm font-black text-gray-700 uppercase tracking-wide">{repair.warrantyStatus || 'Standart'}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Servis Türü</span>
                                        <span className="text-sm font-black text-blue-600 uppercase tracking-wide">{REPAIR_TYPE_LABELS[repair.repairType] || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Yapılan İşlemler Paneli */}
                        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm flex-1 flex flex-col">
                            <div className="px-8 py-5 bg-[#fbfbfd] border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                                    <CheckCircle size={16} className="text-green-500" /> Uygulanan Teknik İşlemler ve Notlar
                                </h3>
                                <div className="h-px flex-1 mx-6 bg-gray-200 opacity-50"></div>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {repair.tests && (
                                        <div className="group">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-2 group-hover:text-blue-500 transition-colors">Tanı Testleri & Gözlemler</p>
                                            <div className="p-4 bg-[#f5f5f7] rounded-24 text-xs leading-relaxed text-gray-800 border border-gray-100 italic relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/30"></div>
                                                "{repair.tests}"
                                            </div>
                                        </div>
                                    )}

                                    {repair.diagnosisNotes && (
                                        <div className="group">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-2 group-hover:text-amber-500 transition-colors">Tanı ve İnceleme Notu</p>
                                            <div className="p-4 bg-[#f5f5f7] rounded-24 text-xs leading-relaxed text-gray-800 border border-gray-100 italic relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/30"></div>
                                                "{repair.diagnosisNotes}"
                                            </div>
                                        </div>
                                    )}

                                    {repair.repairClosingNote && (
                                        <div className="group">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-2 group-hover:text-green-500 transition-colors">Onarım Tamamlama Notu</p>
                                            <div className="p-5 bg-green-50/50 rounded-24 text-sm leading-relaxed text-gray-900 border border-green-100/50 font-bold whitespace-pre-wrap italic shadow-sm relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
                                                "{repair.repairClosingNote.replace(/\n\n\[İşlem Süresi: .*\]$/, '')}"
                                            </div>
                                        </div>
                                    )}

                                    {!repair.tests && !repair.diagnosisNotes && !repair.repairClosingNote && (
                                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 border-dashed text-center">
                                            <p className="text-sm font-bold text-gray-400 italic">
                                                Cihazın bildirilen arızası giderilmiş, gerekli testler yapılarak standartlara uygun şekilde teslim edilmiştir.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {repair.parts && repair.parts.length > 0 && !isReturned && (
                                    <div className="pt-4">
                                        <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 pl-2">Değişimi Yapılan Orijinal Parçalar</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {repair.parts.map((part, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-[#f5f5f7] rounded-xl flex items-center justify-center font-black text-gray-400 text-sm">{index + 1}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{part.description}</p>
                                                            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">P/N: {part.partNumber || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">YENİ SERİ</span>
                                                            <p className="text-xs font-mono font-black text-gray-900">{part.kgbSerial || '-'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-end opacity-40">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ESKİ SERİ</span>
                                                            <p className="text-xs font-mono font-bold text-gray-400">{part.kbbSerial || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Ödeme ve Fatura Detayları */}
                            <div className="mt-auto p-8 pt-0">
                                {(repair.quoteAmount || repair.cost) > 0 ? (
                                    <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full -mr-32 -mt-32 opacity-10"></div>
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-green-400 mb-2">Finansal Özet</h3>
                                                <p className="text-[11px] text-gray-400 font-medium">Bu işlem için müşteri tarafından toplam ödeme tahsil edilmiştir.</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tahsil Edilen Toplam</div>
                                                <div className="text-4xl font-black tracking-tighter text-white">{parseFloat(repair.quoteAmount || repair.cost).toLocaleString('tr-TR')} <span className="text-xl font-medium text-gray-500 ml-1">₺</span></div>
                                                <div className="mt-2 text-[9px] font-black text-green-400 uppercase bg-green-400/10 px-4 py-1 rounded-full inline-block">Ödeme Alındı</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-green-500/5 border border-green-500/10 rounded-[32px] flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[22px] bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                                <CheckCircle size={32} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Ücretsiz Servis İşlemi</h4>
                                                <p className="text-[11px] text-gray-500 font-medium">Garanti kapsamı veya Apple kalite programı dahilinde işlem yapılmıştır.</p>
                                            </div>
                                        </div>
                                        <span className="text-4xl font-black text-green-600 tracking-tighter opacity-20">₺ 0,00</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* İmza Alanı (Sayfa 1) */}
                        <div className="mt-10 grid grid-cols-2 gap-16 border-t border-gray-100 pt-10">
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Teslim Eden Servis Yetkilisi</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-300 text-xl">T</div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">TROY TEKNİK SERVİS</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mersis: 06123456789</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Teslim Alan Müşteri</p>
                                <div className="relative h-24 bg-[#fbfbfd] rounded-24 border border-gray-100 p-4 flex items-center justify-between group">
                                    <div className="flex-1 h-full overflow-hidden">
                                        {signature ? (
                                            <img src={signature} alt="İmza" className="h-full object-contain mix-blend-multiply opacity-80" />
                                        ) : (
                                            <div className="h-full flex items-center text-gray-300 text-[10px] italic font-medium">Sistem üzerinden dijital onay alınmıştır.</div>
                                        )}
                                    </div>
                                    <div className="text-right border-l border-gray-200 pl-6 ml-4">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-[120px]">{repair.customer}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Müşteri Beyanı</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAYFA 2: GARANTİ VE BİLGİLENDİRME */}
                    <div className="p-16 min-h-[1100px] flex flex-col page-break-before bg-white text-gray-900">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
                            <div className="h-10 w-2 bg-green-500 rounded-full"></div>
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tight">Onarım Sonrası Garanti ve Bilgilendirme</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lütfen bu belgeyi garanti süresince saklayınız.</p>
                            </div>
                        </div>

                        <div className="columns-2 gap-10 text-[10px] text-gray-600 space-y-4 text-justify leading-relaxed font-medium">
                            <section className="break-inside-avoid">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 1. İŞLEM VE PARÇA GARANTİSİ
                                </h3>
                                <p className="opacity-80">Cihazınıza uygulanan bu onarım işlemi ve değişen tüm yedek parçalar, teslim tarihinden itibaren 90 (doksan) gün boyunca Troy Teknik Servis garantisi altındadır. Garanti kapsamında işlem yapılabilmesi için cihazın darbe almamış, sıvı temasına maruz kalmamış ve Troy dışındaki bir birim/şahıs tarafından açılmamış olması şarttır.</p>
                            </section>

                            <section className="break-inside-avoid">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 2. ARIZA TEKRARI DURUMU
                                </h3>
                                <p className="opacity-80">Onarılan arızanın garanti süresi içinde tekrarlaması durumunda, cihazın öncelikli olarak kontrol edilmesi için servis formunuzla birlikte merkezimize başvurmanız gerekmektedir. Kontrollerde arızanın farklı bir parçadan kaynaklandığı tespit edilirse ek ücret çıkarılabilir.</p>
                            </section>

                            <section className="break-inside-avoid">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 3. IP SERTİFİKASI
                                </h3>
                                <p className="opacity-80">Ekranda veya kasada yapılan donanım müdahaleleri sonrası cihazın fabrika çıkışındaki su ve toz direnci (IP67/IP68) garanti edilemez. Onarım sırasında sızdırmazlık bantları yenilense dahi cihazın sıvıya maruz bırakılmaması önerilir.</p>
                            </section>

                            <section className="break-inside-avoid">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 4. YEDEK PARÇA İADESİ
                                </h3>
                                <p className="opacity-80">Apple servis kuralları gereğince, onarım sırasında cihazdan çıkarılan 'bozuk/hasarlı' tüm parçalar bertaraf edilmek üzere geri dönüşüme gönderilir. Çıkan parçaların müşteriye iadesi yapılmamaktadır.</p>
                            </section>
                        </div>

                        {/* Satisfaction Area */}
                        <div className="mt-16 p-10 bg-[#f5f5f7] rounded-[48px] border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500 rounded-full opacity-5"></div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500 rounded-full opacity-5"></div>
                            
                            <h4 className="text-xl font-black text-black uppercase mb-3 tracking-tight">Memnuniyetiniz Bizim İçin Değerli</h4>
                            <p className="text-xs text-gray-500 mb-8 max-w-sm font-medium leading-relaxed">
                                Deneyiminizi iyileştirmek için çalışıyoruz. Aldığınız hizmeti değerlendirmek için aşağıdaki kanallardan bize ulaşabilirsiniz.
                            </p>
                            <div className="flex gap-4 mb-8">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-400 font-bold text-xl shadow-sm border border-gray-100 transform hover:scale-110 transition-transform">★</div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bizi Google'da Değerlendirin</span>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <span className="text-xs font-black text-blue-600">google.com/maps/troy-servis</span>
                            </div>
                        </div>

                        {/* İmza Alanı (Sayfa 2 - Teslim Alındı Onayı) */}
                        <div className="mt-auto pt-10 border-t border-gray-100">
                            <div className="bg-[#f5f5f7] p-6 rounded-[32px] mb-10 flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm border border-gray-100">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-[12px] font-bold text-gray-900 leading-tight">
                                    Cihazımı çalışır ve hasarsız vaziyette, yapılan onarımı ve garanti şartlarını kabul ederek teslim aldım.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-20 px-10">
                                <div className="text-center group">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10">Servis Yetki Onayı</p>
                                    <div className="w-20 h-20 bg-gray-50 text-gray-200 border border-gray-100 flex items-center justify-center rounded-[32px] font-black mx-auto mb-4 text-3xl opacity-40">T</div>
                                    <p className="text-[11px] font-black text-gray-800 tracking-tight">TROY TEKNİK SERVİS</p>
                                </div>
                                <div className="text-center group">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10">Müşteri Onayı (İmza)</p>
                                    <div className="h-24 flex items-center justify-center mb-4 relative">
                                        {signature ? (
                                            <img src={signature} alt="İmza" className="h-[140%] object-contain mix-blend-multiply opacity-90 scale-125 transform -rotate-3" />
                                        ) : (
                                            <div className="h-px w-full bg-gray-200 mt-12"></div>
                                        )}
                                    </div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{repair.customer}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#1d1d1f] flex justify-between items-center rounded-b-xl no-print border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            <span className="font-mono text-xs">A4</span>
                        </div>
                        <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] leading-tight opacity-50">
                            PREMIUM DELIVERY FORM<br />
                            ID: {repair.id}-OUT
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-white/40 hover:text-white rounded-xl text-sm font-bold transition-all hover:bg-white/5">Kapat</button>
                        <button onClick={handlePrint} className="px-8 py-3 bg-white text-black hover:scale-105 active:scale-95 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all flex items-center gap-2">
                            <Printer size={18} /> BELGELERİ YAZDIR
                        </button>
                    </div>
                </div>
            </div >

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white; -webkit-print-color-adjust: exact !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                    .print-container { width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    .page-break-before { page-break-before: always; }
                }
                
                .rounded-24 { border-radius: 24px; }
                .rounded-32 { border-radius: 32px; }

                .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: transparent;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }
            `}</style>
        </div >
    );
};

export default DeliveryFormPrint;
