import { useAppContext } from '../context/AppContext';
import html2pdf from 'html2pdf.js';
import { Mail, Loader2, AlertTriangle, Printer, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';

const ServiceFormPrint = ({ formData, repairId, onClose }) => {
    const componentRef = useRef();
    const { emailSettings, companyProfile } = useAppContext();
    const [sendingEmail, setSendingEmail] = useState(false);

    // Güvenli yazdırma fonksiyonu
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Servis_Formu_${repairId}`,
        onAfterPrint: () => onClose() // Yazdırma bitince modalı kapat
    });

    const handleSendEmail = async () => {
        if (!emailSettings?.user || !emailSettings?.pass) {
            Swal.fire({
                title: 'E-posta Ayarları Eksik!',
                text: 'E-posta ayarları yapılmamış. Lütfen ayarlardan e-posta bilgilerinizi giriniz.',
                icon: 'warning',
                confirmButtonColor: '#007aff',
                returnFocus: false
            });
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye sonra iptal et

        try {
            // 1. PDF Oluştur
            const element = componentRef.current;
            const opt = {
                margin: 0,
                filename: `Servis_Formu_${repairId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const htmlString = element.outerHTML;
            const pdfBase64 = await html2pdf().set(opt).from(htmlString).outputPdf('datauristring');

            // 2. Backend'e Gönder
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    to: formData.customerEmail,
                    subject: `Servis Kaydı Oluşturuldu - Takip No: ${repairId}`,
                    body: `Sayın ${formData.customerName},\n\nCihazınız servisimize kabul edilmiştir. Servis formunuz PDF formatında ektedir.\n\nTakip Numaranız: ${repairId}\nCihaz Durumu: Beklemede\n\nİyi günler dileriz.`,
                    auth: {
                        user: emailSettings.user,
                        pass: emailSettings.pass,
                        host: emailSettings.host,
                        port: emailSettings.port
                    },
                    pdfData: pdfBase64,
                    pdfName: `Servis_Formu_${repairId}.pdf`
                })
            });

            clearTimeout(timeoutId);
            const result = await res.json();
            if (result.success) {
                await Swal.fire({
                    title: 'Başarılı!',
                    text: 'E-posta ve servis formu başarıyla müşteriye gönderildi.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    returnFocus: false
                });
                onClose();
            } else {
                throw new Error(result.message || 'Sunucu hatası');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Email send error:', error);
            const isTimeout = error.name === 'AbortError';
            await Swal.fire({
                title: isTimeout ? 'Zaman Aşımı' : 'Gönderilemedi',
                text: isTimeout ? 'E-posta gönderimi çok uzun sürdü. Lütfen internetinizi kontrol edip tekrar deneyin.' : error.message,
                icon: 'error',
                confirmButtonColor: '#007aff',
                returnFocus: false
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const REPAIR_TYPE_LABELS = {
        'carry-in': 'Bizzat Teslim (Mağaza İçi)',
        'returnbefore': 'Değiştirmeden Önce İade',
        'mail-in': 'Bütün Birim Posta (Apple Merkezi)',
        'approval': 'Müşteri Onayı Bekleyen (Teklifli)',
        'service': 'Onarım Olmayan Servis',
        'direct-return': 'İşlemsiz İade'
    };

    const currentDate = new Date().toLocaleDateString('tr-TR');

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-5xl flex flex-col max-h-[95vh] overflow-y-auto rounded-[24px]">
                
                {/* Ön İzleme Alanı */}
                <div ref={componentRef} className="print-container bg-white text-black font-sans leading-normal">
                    {/* SAYFA 1: SERVİS KABUL FORMU */}
                    <div className="p-10 min-h-[1100px] flex flex-col page-break bg-white">
                        
                        {/* 1. Üst Bilgi / Header */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                            <div className="flex items-center gap-5">
                                {companyProfile?.logo ? (
                                    <img src={companyProfile.logo} alt="Logo" className="w-16 h-16 object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-xl font-bold text-3xl">
                                        {companyProfile?.name?.[0] || 'T'}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight">{companyProfile?.name || 'TROY'}</h1>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Yetkili Servis Sağlayıcısı</p>
                                    <div className="mt-1 text-[9px] text-gray-500 leading-tight uppercase font-medium">
                                        <p>{companyProfile?.title || 'ARTIBİLGİ TEKNOLOJİ BİLİŞİM VE DIŞ TİC. A.Ş.'}</p>
                                        <p>{companyProfile?.address || 'Bağdat Caddesi No:123, Kadıköy / İstanbul'}</p>
                                        <p>Tel: {companyProfile?.phone || '0216 123 45 67'} | Web: {companyProfile?.website || 'www.artitroy.com'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <h2 className="text-xl font-black uppercase mb-1">Servis Kabul Formu</h2>
                                <div className="bg-black text-white px-3 py-1 text-sm font-mono font-bold rounded mb-2">#{repairId}</div>
                                <div className="text-[10px] font-bold text-gray-600">
                                    <p>Tarih: {currentDate}</p>
                                    <p>Servis Noktası: {formData.storeName || 'Merkez Servis'}</p>
                                </div>
                                <div className="mt-2">
                                    <img 
                                        src={`https://chart.googleapis.com/chart?chs=80x80&cht=qr&chl=${encodeURIComponent(window.location.origin + '?track=' + repairId)}&choe=UTF-8`} 
                                        alt="QR" 
                                        className="w-16 h-16 border border-gray-100"
                                    />
                                    <p className="text-[7px] font-bold text-gray-400 mt-1 uppercase text-center">Cihaz Takip</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Müşteri ve Cihaz Bilgileri Grid */}
                        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-6">
                            {/* Müşteri Bölümü */}
                            <div className="bg-white p-4">
                                <h3 className="text-[10px] font-black uppercase bg-gray-100 p-1 mb-3 border-l-4 border-black">1. Müşteri Bilgileri</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Ad Soyad:</span>
                                        <span className="font-bold">{formData.customerName}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">TC / VKN:</span>
                                        <span>{formData.customerTC || '-'}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Telefon:</span>
                                        <span className="font-bold">{formData.customerPhone}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">E-Posta:</span>
                                        <span className="lowercase">{formData.customerEmail || '-'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-24 font-bold text-gray-500">Adres:</span>
                                        <span className="flex-1 text-[11px] leading-tight">{formData.customerAddress || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cihaz Bölümü */}
                            <div className="bg-white p-4">
                                <h3 className="text-[10px] font-black uppercase bg-gray-100 p-1 mb-3 border-l-4 border-black">2. Cihaz Bilgileri</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Model:</span>
                                        <span className="font-bold">{formData.deviceModel}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Seri No:</span>
                                        <span className="font-mono font-bold">{formData.serialNumber}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Garanti:</span>
                                        <span className="font-bold uppercase">{formData.warrantyStatus}</span>
                                    </div>
                                    <div className="flex border-b border-gray-50 pb-1">
                                        <span className="w-24 font-bold text-gray-500">Bul (FMI):</span>
                                        <span className={`font-bold ${formData.findMyOff ? 'text-green-600' : 'text-red-600'}`}>{formData.findMyOff ? 'KAPALI (Güvenli)' : 'AÇIK (İşlem Engeli Olabilir)'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-24 font-bold text-gray-500">Servis Türü:</span>
                                        <span className="font-bold">{REPAIR_TYPE_LABELS[formData.repairType] || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Arıza ve Durum Analizi */}
                        <div className="border border-gray-200 mb-6">
                            <h3 className="text-[10px] font-black uppercase bg-gray-100 p-2 border-b border-gray-200">3. Arıza Beyanı ve Fiziksel Gözlemler</h3>
                            <div className="p-4 grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Müşteri Şikayeti / Arıza Notu:</p>
                                    <div className="text-xs font-medium border border-gray-100 p-3 bg-gray-50 rounded min-h-[60px]">
                                        {formData.issueDescription || "Belirtilmedi."}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cihazın Fiziksel Durumu / Aksesuarlar:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.visualCondition && formData.visualCondition.length > 0 ? (
                                            formData.visualCondition.map(item => (
                                                <span key={item} className="px-2 py-1 bg-white border border-gray-300 rounded text-[9px] font-bold uppercase">{item}</span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] italic text-gray-400">Kusur bildirilmedi.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Maliyet Onayı */}
                        <div className="border-2 border-black p-4 mb-8 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-black uppercase mb-1">4. Tahmini Maliyet Bilgisi</h3>
                                    <p className="text-[9px] text-gray-600 max-w-lg">
                                        Aksi belirtilmedikçe bu tutar bir ön tahmindir. Kesin maliyet teknisyen incelemesi sonrası belirlenecektir.
                                        Ücretli işlemlerde belirtilen tutar KDV dahil son kullanıcı fiyatıdır.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Tahmini Toplam</span>
                                    <span className="text-3xl font-black">{parseFloat(formData.estimatedCost || 0).toLocaleString('tr-TR')} ₺</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. Önemli Bilgilendirme (Spot Notlar) */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-3 border border-gray-200 rounded text-[9px] leading-tight">
                                <h4 className="font-bold mb-1 border-b border-gray-100 pb-1 uppercase">Veri Yedekleme</h4>
                                <p>Cihaz içindeki verilerin yedeklenmesi tamamen müşterinin sorumluluğundadır. Servis süreci sonunda oluşabilecek veri kayıplarından servisimiz sorumlu tutulamaz.</p>
                            </div>
                            <div className="p-3 border border-gray-200 rounded text-[9px] leading-tight">
                                <h4 className="font-bold mb-1 border-b border-gray-100 pb-1 uppercase">Aksesuarlar</h4>
                                <p>Onarım işlemi gereği sökülen ekran koruyucu, kaplama ve benzeri aksesuarların iadesi veya yeniden takılması mümkün değildir.</p>
                            </div>
                            <div className="p-3 border border-gray-200 rounded text-[9px] leading-tight">
                                <h4 className="font-bold mb-1 border-b border-gray-100 pb-1 uppercase">Teslimat</h4>
                                <p>Hazır olduğu bildirilen cihazlar 90 gün içerisinde teslim alınmalıdır. Bu süreyi aşan cihazlarda sorumluluk kabul edilmemektedir.</p>
                            </div>
                        </div>

                        {/* 6. İmza Alanları */}
                        <div className="mt-auto grid grid-cols-2 border border-gray-200 h-32">
                            <div className="border-r border-gray-200 p-3 relative flex flex-col justify-between">
                                <span className="text-[9px] font-black uppercase text-gray-400">Servis Yetkilisi (Kaşe/İmza)</span>
                                <div className="text-center pb-2">
                                    <p className="text-[10px] font-bold text-gray-800 uppercase">{formData.technicianName || 'M. Taha Nay'}</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter">Teknik Servis Departmanı</p>
                                </div>
                            </div>
                            <div className="p-3 relative flex flex-col justify-between group">
                                <span className="text-[9px] font-black uppercase text-gray-400">Müşteri Onayı (Ad-Soyad/İmza)</span>
                                <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
                                    {formData.customerSignature && (
                                        <img src={formData.customerSignature} alt="İmza" className="max-h-20 object-contain mix-blend-multiply" />
                                    )}
                                </div>
                                <div className="text-center pb-2 z-10">
                                    <p className="text-[10px] font-bold text-gray-800 uppercase">{formData.customerName}</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter">Şartları Okudum ve Kabul Ettim</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Sayfa Alt Bilgisi */}
                        <div className="mt-4 flex justify-between items-center text-[8px] text-gray-400 uppercase font-bold tracking-widest border-t border-gray-100 pt-2">
                            <span>Bu belge bir servis kabul formudur, fatura yerine geçmez.</span>
                            <span>Sayfa 1 / 2</span>
                        </div>
                    </div>

                    {/* SAYFA 2: DETAYLI SÖZLEŞME VE ŞARTLAR */}
                    <div className="p-10 min-h-[1100px] flex flex-col page-break-before bg-white text-black font-sans">
                        <div className="text-center mb-8 pb-4 border-b border-black">
                            <h2 className="text-lg font-black uppercase tracking-tight">Teknik Servis Hizmet Sözleşmesi ve Yasal Şartlar</h2>
                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Lütfen cihazı teslim etmeden önce aşağıdaki şartları dikkatle okuyunuz.</p>
                        </div>

                        <div className="columns-2 gap-8 text-[9px] text-gray-700 text-justify leading-normal font-medium space-y-4">
                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">1. GENEL KOŞULLAR</h3>
                                <p>İşbu servis formunda belirtilen cihazın Troy Teknik Servis'e teslimi ile müşteri, aşağıda belirtilen tüm şartları kabul etmiş sayılır. Cihazın arıza tespiti süreci, servis yoğunluğuna göre 1-3 iş günü arasında değişebilir.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">2. VERİLERİN KORUNMASI</h3>
                                <p>Servis işlemi sırasında cihaz içindeki verilerin (rehber, fotoğraf, mesaj vb.) silinme ihtimali bulunmaktadır. Yazılım güncellemeleri veya donanımsal ana kart onarımları verilerin kalıcı olarak silinmesine neden olabilir. Yedekleme sorumluluğu tamamen müşteriye aittir. Servisimiz veri kurtarma hizmeti vermemektedir.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">3. SIVI TEMAS VE DARBE DURUMU</h3>
                                <p>Sıvı temasına maruz kalmış cihazlarda oksitlenme süreci durdurulamaz. Bu tür cihazların arıza tespiti sırasında dahi tamamen çalışamaz hale gelme riski bulunmaktadır. Darbe almış cihazlarda, ana kart üzerindeki mikro çatlaklar onarım esnasında derinleşebilir. Bu tür risklerden dolayı servisimiz sorumlu tutulamaz.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">4. YEDEK PARÇA VE ONARIM</h3>
                                <p>Yetkili servisimizce yapılan onarımlarda orijinal Apple yedek parçaları kullanılır. Değiştirilen arızalı parçalar Apple prosedürleri gereği geri verilmez, imha edilir veya Apple'a gönderilir. Ücretli onarımlarda takılan parçalar 90 gün servis garantisi altındadır.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">5. CİHAZIMI BUL (FMI) KİLİDİ</h3>
                                <p>Apple prosedürleri gereği, "Cihazımı Bul" (FMI) özelliği açık olan ürünlere servis hizmeti verilememektedir. Müşteri, cihazını teslim etmeden önce bu özelliği kapatmakla yükümlüdür. Kapatılamayan durumlarda cihaz üzerinde işlem yapılamaz.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">6. TESLİM ALMA VE DEPOLAMA</h3>
                                <p>Servis işlemi tamamlanan veya iade kararı verilen cihazlar, müşteriye yapılan bildirim tarihinden itibaren 90 (doksan) takvim günü içinde teslim alınmalıdır. Bu süre zarfında teslim alınmayan cihazlar için depolama ücreti tahakkuk ettirilebilir. 6 ay içinde alınmayan cihazlar üzerinde mülkiyet hakkı feragati varsayılır.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">7. AKSESUAR VE KORUYUCULAR</h3>
                                <p>Cihaz üzerinde bulunan ekran koruyucu cam, lens koruyucu, kaplama veya sticker gibi harici aksesuarların onarım süreci gereği sökülmesi gerekebilir. Sökülen bu ürünlerin yeniden takılması veya bedelinin iadesi mümkün değildir.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-black border-b border-gray-100 pb-1 mb-2">8. ÜCRETLENDİRME</h3>
                                <p>Garanti dışı cihazlarda arıza tespiti sonrası müşteriye fiyat teklifi sunulur. Onayı alınmayan cihazlar iade edilir. Reddedilen tekliflerde servis noktası kararına bağlı olarak "Arıza Tespit Ücreti" talep edilebilir.</p>
                            </div>
                        </div>

                        {/* Alt Bilgilendirme ve Son Onay */}
                        <div className="mt-auto">
                            <div className="bg-gray-100 p-4 border border-gray-200 mb-8">
                                <p className="text-[10px] font-bold text-center italic">
                                    "Yukarıda belirtilen şartları okudum, anladım ve cihazımı bu şartlar altında onarım/teşhis için Troy Teknik Servis'e teslim etmeyi kabul ediyorum."
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-20 px-10">
                                <div className="text-center">
                                    <div className="h-20 border-b border-gray-300 mb-2 flex items-end justify-center">
                                        <div className="text-[8px] text-gray-300 font-bold mb-1 uppercase">İşletme Kaşesi</div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase">{companyProfile?.name || 'TROY'} YETKİLİ SERVİS</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-20 border-b border-gray-300 mb-2 flex items-end justify-center relative">
                                        {formData.customerSignature && (
                                            <img src={formData.customerSignature} alt="İmza" className="max-h-16 object-contain mix-blend-multiply mb-1" />
                                        )}
                                        {!formData.customerSignature && <div className="text-[8px] text-gray-300 font-bold mb-1 uppercase">Müşteri Islak İmza</div>}
                                    </div>
                                    <p className="text-[10px] font-black uppercase">{formData.customerName}</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-between items-center text-[8px] text-gray-400 uppercase font-bold tracking-widest border-t border-gray-100 pt-2">
                                <span>TROY TEKNİK SERVİS YÖNETİM SİSTEMİ</span>
                                <span>Sayfa 2 / 2</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Eylemleri */}
                <div className="p-6 bg-gray-900 flex justify-between items-center no-print">
                    <div className="flex items-center gap-4">
                        <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em]">
                            PREMIUM DOCUMENT v2.0<br />
                            REP-ID: {repairId}
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-white/60 hover:text-white rounded-xl text-sm font-bold transition-all"
                        >
                            İptal
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                            className="px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
                        >
                            {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                            {sendingEmail ? 'GÖNDERİLİYOR...' : 'E-POSTA GÖNDER'}
                        </button>

                        <button
                            onClick={handlePrint}
                            className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <Printer size={18} />
                            FORMU YAZDIR (A4)
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; }
                    .print-container { width: 100% !important; margin: 0 !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    .page-break-before { page-break-before: always; }
                }
                .print-container * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            `}</style>
        </div>
    );

};

export default ServiceFormPrint;
