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
            <div className="modal-content w-full max-w-4xl flex flex-col max-h-[90vh] overflow-y-auto">
                
                {/* Ön İzleme Alanı */}
                <div ref={componentRef} className="print-container bg-white text-gray-900 font-sans">
                    {/* SAYFA 1: SERVİS KABUL FORMU */}
                    <div className="p-12 min-h-[1100px] flex flex-col page-break bg-white">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-10 mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-[#f5f5f7] text-black flex items-center justify-center rounded-[24px] font-black text-4xl border border-gray-100 shadow-sm">
                                    {companyProfile?.name?.[0] || 'T'}
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black tracking-tight text-black">{companyProfile?.name || 'TROY'}</h1>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Yetkili Servis Sağlayıcısı</p>
                                    </div>
                                    <div className="pt-2 text-[10px] text-gray-400 font-medium leading-relaxed max-w-[300px]">
                                        <p className="uppercase opacity-80">{companyProfile?.title || 'ARTIBİLGİ TEKNOLOJİ BİLİŞİM VE DIŞ TİC. A.Ş.'}</p>
                                        <p>{companyProfile?.address || 'Bağdat Caddesi No:123, 34728 Kadıköy / İstanbul'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-end bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                        <img 
                                            src={`https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(window.location.origin + '?track=' + repairId)}&choe=UTF-8`} 
                                            alt="Sorgulama QR" 
                                            className="w-20 h-20"
                                        />
                                        <span className="text-[7px] font-black text-gray-400 mt-1 uppercase tracking-tight">Kamera ile Sorgula</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Servis Kabul Formu</div>
                                        <div className="flex flex-col items-end mt-2">
                                            <h2 className="text-5xl font-mono font-black text-black tracking-tighter">#{repairId}</h2>
                                            <div className="h-1 w-full bg-blue-500 mt-1 rounded-full opacity-20"></div>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Kabul: <span className="text-black">{currentDate}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bilgi Kutuları */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                                    Müşteri Bilgileri
                                </h3>
                                <div className="space-y-4 pt-2 relative z-10">
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ad Soyad</span>
                                        <span className="text-base font-black text-gray-900">{formData.customerName}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">TC / VKN</span>
                                        <span className="text-sm font-bold text-gray-700">{formData.customerTC || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Telefon</span>
                                        <span className="text-sm font-black text-gray-900">{formData.customerPhone}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">E-Posta</span>
                                        <span className="text-sm font-black text-gray-900 lowercase">{formData.customerEmail || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Adres</span>
                                        <span className="text-[12px] leading-relaxed text-gray-600 font-medium">{formData.customerAddress || 'Belirtilmedi'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                                    Cihaz Detayları
                                </h3>
                                <div className="space-y-4 pt-2 relative z-10">
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Model</span>
                                        <span className="text-base font-black text-blue-600">{formData.deviceModel}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Cihaz Türü</span>
                                        <span className="text-sm font-black text-gray-900 uppercase">{formData.productGroup || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Seri No</span>
                                        <span className="text-sm font-mono font-black tracking-tight text-gray-900">{formData.serialNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Garanti</span>
                                        <span className="text-sm font-black text-gray-700 uppercase">{formData.warrantyStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Bul / FMI</span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${formData.findMyOff ? 'bg-green-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'}`}>
                                            {formData.findMyOff ? 'KAPALI' : 'AÇIK'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Servis Türü</span>
                                        <span className="text-sm font-black text-blue-600 uppercase">
                                            {REPAIR_TYPE_LABELS[formData.repairType] || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Arıza ve Fiziksel Durum */}
                        <div className="mb-10 bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                            <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-orange-500" /> Şikayet ve Fiziksel Analiz
                                </h3>
                            </div>
                            <div className="p-8">
                                <div className="text-base text-gray-800 leading-relaxed min-h-[120px] mb-8 p-6 bg-[#fbfbfd] rounded-2xl border border-gray-100 italic relative">
                                    <div className="absolute top-4 left-4 text-4xl text-gray-200 font-serif">"</div>
                                    <div className="pl-6">{formData.issueDescription || "Cihazın bildirilen bir arızası bulunmamaktadır."}</div>
                                    <div className="absolute bottom-4 right-4 text-4xl text-gray-200 font-serif rotate-180">"</div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 pl-1">Teknik Gözlemler</h4>
                                    <div className="flex flex-wrap gap-2.5">
                                        {formData.visualCondition && formData.visualCondition.length > 0 ? (
                                            formData.visualCondition.map(item => (
                                                <span key={item} className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 uppercase shadow-sm tracking-wider flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                                    {item}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic font-medium p-2">Kusurlu fiziksel durum veya aksesuar bildirilmedi.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Finansal Bilgiler */}
                        <div className="mb-12">
                            {formData.estimatedCost > 0 ? (
                                <div className="p-8 bg-gray-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 opacity-10"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="max-w-md">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
                                                Onaylanan Tahmini Maliyet
                                            </h3>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Müşteri, yukarıda belirtilen arızanın giderilmesi için öngörülen <span className="text-white font-bold">{parseFloat(formData.estimatedCost).toLocaleString('tr-TR')} ₺</span> tutarındaki bedeli kabul eder. Bu tutar %20 KDV dahil son fiyattır.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Toplam Tutar</div>
                                            <div className="text-5xl font-black tracking-tighter text-white">{parseFloat(formData.estimatedCost).toLocaleString('tr-TR')} <span className="text-2xl font-medium text-gray-500 ml-1">₺</span></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-[#f5f5f7] border border-gray-100 rounded-[32px] flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[20px] bg-green-500 flex items-center justify-center text-white shadow-lg">
                                            <CheckCircle size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Ücretsiz İşlem (Garanti Kapsamı)</h4>
                                            <p className="text-[11px] text-gray-500 font-medium">Bu işlem için herhangi bir teknik servis ücreti tahsil edilmeyecektir.</p>
                                        </div>
                                    </div>
                                    <span className="text-4xl font-black text-gray-400 tracking-tighter">0,00 ₺</span>
                                </div>
                            )}
                        </div>

                        {/* İmza Alanı */}
                        <div className="mt-auto grid grid-cols-2 gap-16 border-t border-gray-100 pt-10">
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Teslim Alan Uzman</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-300 text-xl">MT</div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">M. Taha Nay</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kıdemli Servis Yetkilisi</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Müşteri Onayı</p>
                                <div className="relative h-24 bg-[#fbfbfd] rounded-2xl border border-gray-100 p-4 flex items-center justify-between group">
                                    <div className="flex-1 h-full overflow-hidden">
                                        {formData.customerSignature ? (
                                            <img src={formData.customerSignature} alt="İmza" className="h-full object-contain mix-blend-multiply opacity-80" />
                                        ) : (
                                            <div className="h-full flex items-center text-gray-300 text-[10px] italic font-medium">Dijital imza kaydı sistemde saklanmaktadır.</div>
                                        )}
                                    </div>
                                    <div className="text-right border-l border-gray-200 pl-6 ml-4">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-[120px]">{formData.customerName}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Müşteri Beyanı</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAYFA 2: SÖZLEŞME */}
                    <div className="p-16 min-h-[1100px] flex flex-col page-break-before bg-white text-gray-900">
                        <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-2 bg-blue-500 rounded-full"></div>
                                <div>
                                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">Teknik Servis Genel Hizmet Sözleşmesi</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lütfen bu metni dikkatlice okuyunuz ve imza öncesi onaylayınız.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-mono font-black text-black tracking-tighter">#{repairId}</div>
                                <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Sözleşme No</div>
                            </div>
                        </div>

                        <div className="columns-2 gap-10 text-[10px] text-gray-600 space-y-3 text-justify leading-relaxed font-medium">
                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 1. GENEL ŞARTLAR
                                </h3>
                                <p className="opacity-80">İşbu sözleşme, Troy Teknik Servis (Artıbilgi Teknoloji A.Ş.) ile müşteri arasında servis girişi yapılan cihazın onarım ve hizmet şartlarını belirler. Cihazın servise bırakılmasıyla birlikte müşteri bu şartları gayrikabili rücu kabul etmiş sayılır.</p>
                            </section>

                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 2. VERİ GÜVENLİĞİ
                                </h3>
                                <p className="opacity-80">Cihaz içindeki verilerin yedeklenmesi tamamen müşterinin sorumluluğundadır. Servis işlemi sırasında oluşabilecek veri kayıplarından Troy Teknik Servis kesinlikle sorumlu tutulamaz. Yazılım onarımlarında cihaz formatlanarak fabrika ayarlarına döndürülür.</p>
                            </section>

                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 3. AKSESUARLAR
                                </h3>
                                <p className="opacity-80">Cihaz üzerindeki kırılmaz cam, kamera koruyucu, kaplama veya sticker gibi aksesuarlar onarım süreci gereği sökülmek zorundadır. Sökülen bu ürünlerin iadesi veya ücretsiz olarak takılması mümkün değildir.</p>
                            </section>

                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 4. SIVI TEMAS VE DARBE
                                </h3>
                                <p className="opacity-80">Sıvı temaslı cihazlarda oksitlenme süreci durdurulamaz. Arıza tespiti çalışmaları sırasında cihazın tamamen kapanma riski mevcuttur. Darbeli cihazlarda ise ana kart üzerindeki mikro çatlaklar söküm sırasında kalıcı hasara dönüşebilir.</p>
                            </section>

                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 5. GARANTİ ŞARTLARI
                                </h3>
                                <p className="opacity-80">Apple yetkili servisimizce yapılan onarımlarda Apple global garanti şartları geçerlidir. Ücretli onarımlarda ise değiştirilen parça kullanıcı hatası olmaksızın 90 gün boyunca işlem garantisi altındadır.</p>
                            </section>

                            <section className="break-inside-avoid mb-6">
                                <h3 className="font-black text-black mb-2 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div> 6. MUHAFAZA VE TESLİM
                                </h3>
                                <p className="opacity-80">Bildirim tarihinden itibaren 90 (doksan) gün içerisinde teslim alınmayan cihazlardan firmamız sorumlu değildir. 90 günü aşan beklemelerde 'depolama ücreti' talep edilebilir veya hukuki süreç başlatılır.</p>
                            </section>
                        </div>

                        {/* İmza Alanı (Sayfa 2 - Sözleşme Onayı) */}
                        <div className="mt-auto pt-10 border-t border-gray-100">
                            <div className="bg-[#f5f5f7] p-6 rounded-[32px] mb-10 flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-100">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-[12px] font-bold text-gray-900 leading-tight">
                                    Müşteri olarak, yukarıdaki 2 sayfalık sözleşme metnini ve teknik riskleri okudum, anladım ve cihazımı bu şartlar altında teslim ediyorum.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-20 px-10">
                                <div className="text-center group">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10 group-hover:text-gray-400 transition-colors">İşletme Kaşe / Onay</p>
                                    <div className="w-20 h-20 bg-gray-50 text-gray-200 border border-gray-100 flex items-center justify-center rounded-[32px] font-black mx-auto mb-4 text-3xl opacity-40 grayscale">
                                        {companyProfile?.name?.[0] || 'T'}
                                    </div>
                                    <p className="text-[11px] font-black text-gray-800 tracking-tight">{companyProfile?.name || 'TROY'} YETKİLİ SERVİS</p>
                                </div>
                                <div className="text-center group">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10 group-hover:text-gray-400 transition-colors">Müşteri Islak İmza</p>
                                    <div className="h-24 flex items-center justify-center mb-4 relative">
                                        {formData.customerSignature ? (
                                            <img src={formData.customerSignature} alt="İmza" className="h-[140%] object-contain mix-blend-multiply opacity-90 scale-125 transform -rotate-3" />
                                        ) : (
                                            <div className="h-px w-full bg-gray-200 mt-12"></div>
                                        )}
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{formData.customerName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Eylemleri */}
                <div className="p-6 bg-[#1d1d1f] flex justify-between items-center no-print rounded-b-xl border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            <span className="font-mono text-xs">A4</span>
                        </div>
                        <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] leading-tight opacity-50">
                            PREMIUM SERVICE FORM<br />
                            ID: {repairId}
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-white/40 hover:text-white rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                        >
                            İptal
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                            className="px-6 py-3 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 border border-blue-500/20 shadow-lg shadow-blue-900/10 disabled:opacity-50"
                        >
                            {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                            {sendingEmail ? 'GÖNDERİLİYOR...' : 'E-POSTA GÖNDER'}
                        </button>

                        <button
                            onClick={handlePrint}
                            className="px-8 py-3 bg-white text-black hover:scale-105 active:scale-95 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all flex items-center gap-2"
                        >
                            <Printer size={18} />
                            FORMU YAZDIR
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white; -webkit-print-color-adjust: exact !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                    .print-container { width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    .page-break-before { page-break-before: always; }
                }

                .print-container {
                    font-smoothing: antialiased;
                    -webkit-font-smoothing: antialiased;
                }
            `}</style>
        </div>
    );
};

export default ServiceFormPrint;
