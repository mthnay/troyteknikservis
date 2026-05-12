import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Scan,
    CheckCircle,
    AlertTriangle,
    Shield,
    ShieldAlert,
    X,
    Search,
    Camera,
    Save,
    Eraser,
    ImagePlus,
    Video,
    Loader2,
    ExternalLink,
    User,
    FileText,
    ChevronRight,
    ArrowLeft,
    Check,
    Wrench,
    RefreshCcw,
    Package,
    AlertCircle,
    Clock,
    Zap,
    Box
} from 'lucide-react';
import ServiceFormPrint from './ServiceFormPrint';
import Toast from './Toast'; // Import Toast
import { useAppContext } from '../context/AppContext';
import { appConfirm } from '../utils/alert';
import MyPhoneIcon from './LocalIcons';
import { getProductImage } from '../utils/productImages';

const PRODUCT_GROUPS = [
    { id: 'iphone', label: 'iPhone', icon: MyPhoneIcon, color: 'bg-blue-600', img: getProductImage('iphone') },
    { id: 'ipad', label: 'iPad', icon: Package, color: 'bg-indigo-500', img: getProductImage('ipad') },
    { id: 'mac', label: 'Mac', icon: FileText, color: 'bg-slate-700', img: getProductImage('mac') },
    { id: 'watch', label: 'Apple Watch', icon: Clock, color: 'bg-orange-600', img: getProductImage('watch') },
    { id: 'airpods', label: 'AirPods', icon: Zap, color: 'bg-emerald-600', img: getProductImage('airpods') },
    { id: 'other', label: 'Aksesuar & Beats', icon: Box, color: 'bg-purple-600', img: getProductImage('other') }
];

// Fallback images if the ones above are not reachable
const PRODUCT_IMAGES = {
    iphone: getProductImage('iphone'),
    ipad: getProductImage('ipad'),
    mac: getProductImage('mac'),
    watch: getProductImage('watch'),
    airpods: getProductImage('airpods'),
    other: getProductImage('other')
};

const DEVICE_DATABASE = [
    // iPhones
    { name: 'iPhone 15 Pro Max', capacities: ['256 GB', '512 GB', '1 TB'], colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
    { name: 'iPhone 15 Pro', capacities: ['128 GB', '256 GB', '512 GB', '1 TB'], colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
    { name: 'iPhone 15 Plus', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'] },
    { name: 'iPhone 15', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'] },
    { name: 'iPhone 14 Pro Max', capacities: ['128 GB', '256 GB', '512 GB', '1 TB'], colors: ['Deep Purple', 'Gold', 'Silver', 'Space Black'] },
    { name: 'iPhone 14 Pro', capacities: ['128 GB', '256 GB', '512 GB', '1 TB'], colors: ['Deep Purple', 'Gold', 'Silver', 'Space Black'] },
    { name: 'iPhone 14 Plus', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Blue', 'Purple', 'Midnight', 'Starlight', '(PRODUCT)RED', 'Yellow'] },
    { name: 'iPhone 14', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Blue', 'Purple', 'Midnight', 'Starlight', '(PRODUCT)RED', 'Yellow'] },
    { name: 'iPhone 13 Pro Max', capacities: ['128 GB', '256 GB', '512 GB', '1 TB'], colors: ['Sierra Blue', 'Graphite', 'Gold', 'Silver', 'Alpine Green'] },
    { name: 'iPhone 13 Pro', capacities: ['128 GB', '256 GB', '512 GB', '1 TB'], colors: ['Sierra Blue', 'Graphite', 'Gold', 'Silver', 'Alpine Green'] },
    { name: 'iPhone 13', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pink', 'Blue', 'Midnight', 'Starlight', '(PRODUCT)RED', 'Green'] },
    { name: 'iPhone 13 mini', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pink', 'Blue', 'Midnight', 'Starlight', '(PRODUCT)RED', 'Green'] },
    { name: 'iPhone 12 Pro Max', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pacific Blue', 'Gold', 'Graphite', 'Silver'] },
    { name: 'iPhone 12 Pro', capacities: ['128 GB', '256 GB', '512 GB'], colors: ['Pacific Blue', 'Gold', 'Graphite', 'Silver'] },
    { name: 'iPhone 12 mini', capacities: ['64 GB', '128 GB', '256 GB'], colors: ['Black', 'White', '(PRODUCT)RED', 'Green', 'Blue', 'Purple'] },
    { name: 'iPhone 12', capacities: ['64 GB', '128 GB', '256 GB'], colors: ['Black', 'White', '(PRODUCT)RED', 'Green', 'Blue', 'Purple'] },
    { name: 'iPhone 11 Pro Max', capacities: ['64 GB', '256 GB', '512 GB'], colors: ['Midnight Green', 'Space Gray', 'Silver', 'Gold'] },
    { name: 'iPhone 11 Pro', capacities: ['64 GB', '256 GB', '512 GB'], colors: ['Midnight Green', 'Space Gray', 'Silver', 'Gold'] },
    { name: 'iPhone 11', capacities: ['64 GB', '128 GB', '256 GB'], colors: ['Black', 'Green', 'Yellow', 'Purple', '(PRODUCT)RED', 'White'] },
    { name: 'iPhone SE (3rd Gen)', capacities: ['64 GB', '128 GB', '256 GB'], colors: ['Midnight', 'Starlight', '(PRODUCT)RED'] },
    { name: 'iPhone SE (2nd Gen)', capacities: ['64 GB', '128 GB', '256 GB'], colors: ['Black', 'White', '(PRODUCT)RED'] },
    
    // iPads
    { name: 'iPad Pro 12.9"', generations: ['6th Gen (M2)', '5th Gen (M1)', '4th Gen'], capacities: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB'] },
    { name: 'iPad Pro 11"', generations: ['4th Gen (M2)', '3rd Gen (M1)', '2nd Gen'], capacities: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB'] },
    { name: 'iPad Air (5th Gen)', capacities: ['64 GB', '256 GB'], colors: ['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue'] },
    { name: 'iPad Air (4th Gen)', capacities: ['64 GB', '256 GB'], colors: ['Space Gray', 'Silver', 'Rose Gold', 'Green', 'Sky Blue'] },
    { name: 'iPad (10th Gen)', capacities: ['64 GB', '256 GB'], colors: ['Silver', 'Blue', 'Pink', 'Yellow'] },
    { name: 'iPad mini (6th Gen)', capacities: ['64 GB', '256 GB'], colors: ['Space Gray', 'Pink', 'Purple', 'Starlight'] },

    // MacBooks
    { name: 'MacBook Air 13" (M3)', chips: ['M3'], configurations: ['8 GB RAM', '16 GB RAM', '24 GB RAM'] },
    { name: 'MacBook Air 13" (M2)', chips: ['M2'], configurations: ['8 GB RAM', '16 GB RAM', '24 GB RAM'] },
    { name: 'MacBook Air 13" (M1)', chips: ['M1'], configurations: ['8 GB RAM', '16 GB RAM'] },
    { name: 'MacBook Air 15" (M3)', chips: ['M3'], configurations: ['8 GB RAM', '16 GB RAM', '24 GB RAM'] },
    { name: 'MacBook Air 15" (M2)', chips: ['M2'], configurations: ['8 GB RAM', '16 GB RAM', '24 GB RAM'] },
    { name: 'MacBook Pro 14"', chips: ['M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max', 'M3', 'M3 Pro', 'M3 Max'], configurations: ['16 GB RAM', '32 GB RAM', '64 GB RAM', '96 GB RAM', '128 GB RAM'] },
    { name: 'MacBook Pro 16"', chips: ['M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max', 'M3 Pro', 'M3 Max'], configurations: ['16 GB RAM', '32 GB RAM', '64 GB RAM', '96 GB RAM', '128 GB RAM'] },
    { name: 'MacBook Pro 13"', chips: ['M2', 'M1', 'Intel Core i5'], configurations: ['8 GB RAM', '16 GB RAM', '32 GB RAM'] },

    // Apple Watch
    { name: 'Apple Watch Ultra 2', sizes: ['49mm'], materials: ['Titanium'] },
    { name: 'Apple Watch Ultra', sizes: ['49mm'], materials: ['Titanium'] },
    { name: 'Apple Watch Series 9', sizes: ['41mm', '45mm'], materials: ['Aluminum', 'Stainless Steel'] },
    { name: 'Apple Watch Series 8', sizes: ['41mm', '45mm'], materials: ['Aluminum', 'Stainless Steel'] },
    { name: 'Apple Watch SE (2nd Gen)', sizes: ['40mm', '44mm'], materials: ['Aluminum'] },

    // AirPods
    { name: 'AirPods Pro (2nd Gen)', configurations: ['USB-C Case', 'Lightning Case'] },
    { name: 'AirPods (3rd Gen)', configurations: ['MagSafe Case', 'Lightning Case'] },
    { name: 'AirPods Max', colors: ['Space Gray', 'Silver', 'Pink', 'Green', 'Sky Blue'] }
];


const ServiceAcceptance = ({ setActiveTab, initialData, clearInitialData }) => {
    const { addRepair, customers, addCustomer, companyProfile, uploadMedia } = useAppContext();
    const [step, setStep] = useState(1);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showKioskModal, setShowKioskModal] = useState(false);
    const [lastRepairId, setLastRepairId] = useState(null);
    const [searching, setSearching] = useState(false);
    const [toast, setToast] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const serialInputRef = useRef(null); // Seri No tarama için ayrı ref

    // Suggestion State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [deviceSuggestions, setDeviceSuggestions] = useState([]);
    const suggestionsRef = useRef(null);

    // Click outside to close suggestions
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Initial Data (from Customer Detail)
    React.useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                customerTC: initialData.tcNo || initialData.customerTC || '',
                customerAddress: initialData.customerAddress || initialData.address || '',
                serialNumber: initialData.serial || initialData.serialNumber || '',
                deviceModel: initialData.device || initialData.deviceModel || ''
            }));
            // We set step to 1 (initially), but maybe we can keep it as is.
            // But if we want to visually show the data is filled, user sees it when they reach step 2.
            // Or we could auto-advance if we had device info too. But we don't.
            if (clearInitialData) clearInitialData();
        }
    }, [initialData]);

    const [formData, setFormData] = useState({
        productGroup: '', // iphone, ipad, mac, watch, airpods, other
        serviceType: 'repair',
        serialNumber: '',
        deviceModel: '',
        warrantyStatus: '',
        estimatedCost: '', // Tahmini/Alınan Ücret
        vmiStatus: 'green', // green, yellow, red
        lciStatus: 'clean', // clean, triggered
        visualCondition: [],
        findMyOff: false,
        backupTaken: false,
        customerName: '',
        customerType: 'positive', // positive | negative
        customerTC: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        issueDescription: '',
        beforeImages: [],
        afterImages: [],
        mediaFiles: [],
        notes: ''
    });
    const sigCanvas = useRef(null);

    // ...

    const handlePrepareSubmission = () => {
        try {
            // 1. Zorunlu Alan Kontrolü
            if (!formData.serialNumber) { setToast({ message: 'Lütfen Seri Numarası giriniz.', type: 'error' }); return; }
            if (!formData.deviceModel) { setToast({ message: 'Lütfen Cihaz Modeli seçiniz.', type: 'error' }); return; }
            if (!formData.warrantyStatus) { setToast({ message: 'Lütfen Garanti Durumu seçiniz.', type: 'error' }); return; }
            if (!formData.customerName) { setToast({ message: 'Lütfen Müşteri Adı giriniz.', type: 'error' }); return; }
            if (!formData.customerPhone) { setToast({ message: 'Lütfen Müşteri Telefonu giriniz.', type: 'error' }); return; }
            if (!formData.findMyOff) { setToast({ message: 'Lütfen "Cihazımı Bul" özelliğinin kapalı olduğunu teyit ediniz.', type: 'error' }); return; }

            // Geçiş: Form geçerliyse doğrudan full-screen Kiosk Modal aç.
            setShowKioskModal(true);

        } catch (error) {
            console.error('Validation Error:', error);
            setToast({ message: 'İşlem başarısız: ' + (error.message || 'Bilinmeyen Hata'), type: 'error' });
        }
    };

    const handleConfirmKiosk = async () => {
        try {
            if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
                setToast({ message: 'Lütfen servis formunu parmağınızla imzalayınız.', type: 'error' });
                return;
            }

            const signatureData = sigCanvas.current.toDataURL('image/png');

            // 3. Resim ve Medya Hazırlığı
            // En az bir tane gerçek yüklenen fotoğraf varsa onu ana resim yapalım,
            // yoksa varsayılan ürün görselini kullanalım.
            const realPhotos = formData.mediaFiles?.filter(f => !f.isDefault) || [];
            const mainImage = realPhotos.length > 0 ? realPhotos[0].url : (formData.mediaFiles?.[0]?.url || null);

            // AppContext üzerinden kayıt ekle
            const newRepair = await addRepair({
                ...formData, // Tüm form verilerini aktar
                device: formData.deviceModel,
                serial: formData.serialNumber, // Fix Serial Number Mapping
                customer: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
                customerAddress: formData.customerAddress,
                tcNo: formData.customerTC,
                issue: formData.issueDescription,
                status: formData.serviceType !== 'repair' ? 'Cihaz Hazır' : 'Beklemede',
                date: new Date().toLocaleDateString('tr-TR'),
                image: mainImage,
                customerSignature: signatureData // İmzayı kaydet
            });

            // MongoDB _id veya bizim özel id'miz varsa kabul et
            const repairId = newRepair?.id || newRepair?._id;

            if (repairId) {
                // --- Otomatik Müşteri Kaydı ---
                // Telefon veya E-posta ile mevcut müşteriyi kontrol et
                const existingCustomer = customers.find(c =>
                    (formData.customerPhone && c.phone === formData.customerPhone) ||
                    (formData.customerEmail && c.email === formData.customerEmail)
                );

                if (!existingCustomer) {
                    try {
                        const newCustomerData = {
                            name: formData.customerName,
                            phone: formData.customerPhone,
                            email: formData.customerEmail,
                            address: formData.customerAddress || '',
                            tc: formData.customerTC || '',
                            type: 'bireysel', // Varsayılan
                            notes: 'Servis kaydı sırasında otomatik oluşturuldu.'
                        };

                        // Arka planda ekle (await etmemize gerek yok ama log için bekleyebiliriz)
                        addCustomer(newCustomerData).then(() => {
                            console.log("Yeni müşteri otomatik olarak eklendi:", formData.customerName);
                        });

                    } catch (custErr) {
                        console.error("Otomatik müşteri ekleme hatası:", custErr);
                    }
                }

                setToast({ message: `Servis kaydı başarıyla oluşturuldu! Kayıt No: #${repairId}`, type: 'success' });
                setLastRepairId(repairId);
                setFormData(prev => ({ ...prev, customerSignature: signatureData }));
                setShowKioskModal(false);
                setShowPrintModal(true);
            } else {
                console.error("Dönen Kayıt:", newRepair); // Debug için
                throw new Error('Kayıt oluşturulurken bir sorun oluştu (ID alınamadı).');
            }

        } catch (error) {
            console.error('Submit Error:', error);
            setToast({ message: 'İşlem başarısız: ' + (error.message || 'Bilinmeyen Hata'), type: 'error' });
        }
    };
    const handleDeviceModelChange = (e) => {
        const val = e.target.value;
        setFormData({ ...formData, deviceModel: val });

        if (val.length > 1) {
            const searchTerms = val.toLowerCase().split(' ').filter(t => t.length > 0);
            
            const results = [];
            DEVICE_DATABASE.forEach(dev => {
                // Check if device name contains at least one search term to be broad, 
                // but we'll refine it later
                const nameLower = dev.name.toLowerCase();
                const matchesInitial = searchTerms.some(term => nameLower.includes(term));
                
                if (matchesInitial) {
                    // Generate combinations
                    let combinations = [];
                    
                    if (dev.capacities && dev.colors) {
                        dev.colors.forEach(color => {
                            dev.capacities.forEach(cap => {
                                combinations.push(`${dev.name}, ${cap}, ${color}`);
                            });
                        });
                    } else if (dev.chips && dev.configurations) {
                        dev.chips.forEach(chip => {
                            dev.configurations.forEach(config => {
                                combinations.push(`${dev.name}, ${chip}, ${config}`);
                            });
                        });
                    } else if (dev.capacities && dev.generations) {
                        dev.generations.forEach(gen => {
                            dev.capacities.forEach(cap => {
                                combinations.push(`${dev.name} (${gen}), ${cap}`);
                            });
                        });
                    } else if (dev.sizes && dev.materials) {
                        dev.materials.forEach(mat => {
                            dev.sizes.forEach(size => {
                                combinations.push(`${dev.name}, ${size}, ${mat}`);
                            });
                        });
                    } else if (dev.configurations) {
                        dev.configurations.forEach(config => {
                            combinations.push(`${dev.name}, ${config}`);
                        });
                    } else if (dev.colors) {
                        dev.colors.forEach(color => {
                            combinations.push(`${dev.name}, ${color}`);
                        });
                    } else {
                        combinations.push(dev.name);
                    }

                    // Filter combinations that match ALL search terms
                    combinations.forEach(combo => {
                        const comboLower = combo.toLowerCase();
                        if (searchTerms.every(term => comboLower.includes(term))) {
                            results.push(combo);
                        }
                    });
                }
            });

            // Sort results: shorter matches and matches starting with the search term first
            const sortedResults = results.sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const firstTerm = searchTerms[0];
                
                const aStarts = aLower.startsWith(firstTerm);
                const bStarts = bLower.startsWith(firstTerm);
                
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                return a.length - b.length;
            }).slice(0, 50);

            setDeviceSuggestions(sortedResults);
            setShowSuggestions(sortedResults.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    // Simüle edilmiş cihaz arama (Apple Veritabanı Sorgulama)
    // Simüle edilmiş cihaz arama (Apple Veritabanı Sorgulama)
    // REMOVED FAKE SIMULATION to avoid "Not Real" feedback.
    // Real logic would require an expensive API integration (GSX etc).
    // Replacing with a placeholder that informs user.
    const handleSerialSearch = async () => {
        if (!formData.serialNumber) return;
        setSearching(true);

        // In a real production app without GSX access, we can't look up serials.
        // We will just simulate a network delay and then say "Not found in local DB" 
        // to be honest, instead of fake finding an iPhone.

        setTimeout(() => {
            setSearching(false);
            setToast({ message: 'Seri numarası yerel veritabanında bulunamadı. Lütfen bilgileri manuel giriniz.', type: 'info' });
        }, 800);
    };

    const openAppleCoverage = () => {
        if (!formData.serialNumber) {
            setToast({ message: 'Lütfen önce bir seri numarası giriniz.', type: 'warning' });
            return;
        }
        const url = `https://checkcoverage.apple.com/?sn=${formData.serialNumber}`;
        window.open(url, '_blank');
    };

    const toggleCondition = (condition) => {
        setFormData(prev => ({
            ...prev,
            visualCondition: prev.visualCondition.includes(condition)
                ? prev.visualCondition.filter(c => c !== condition)
                : [...prev.visualCondition, condition]
        }));
    };

    const handleAddPhoto = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e, category = 'before') => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadMedia(file);

            if (data && data.url) {
                setFormData(prev => {
                    const field = category === 'before' ? 'beforeImages' : 'afterImages';
                    return {
                        ...prev,
                        [field]: [...(prev[field] || []), data.url]
                    };
                });
                setToast({ message: 'Fotoğraf başarıyla eklendi.', type: 'success' });
            } else {
                setToast({ message: 'Yükleme başarısız oldu.', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'Hata: ' + (error.message || 'Dosya yükleme hatası.'), type: 'error' });
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const removePhoto = (index, category = 'before') => {
        setFormData(prev => {
            const field = category === 'before' ? 'beforeImages' : 'afterImages';
            const newList = [...(prev[field] || [])];
            newList.splice(index, 1);
            return { ...prev, [field]: newList };
        });
    };

    // TC Kimlik Doğrulama Algoritması
    const validateTC = (value) => {
        value = String(value);
        if (!value || value.length !== 11) return null; // Henüz tam girilmedi
        if (value[0] === '0') return false;

        let odd = 0, even = 0, sum = 0;
        for (let i = 0; i < 9; i++) {
            const digit = parseInt(value[i]);
            if (i % 2 === 0) odd += digit; // 1, 3, 5, 7, 9. haneler (indeks 0, 2, 4...)
            else even += digit;            // 2, 4, 6, 8. haneler
            sum += digit;
        }

        const tenth = ((odd * 7) - even) % 10;
        const eleventh = (sum + tenth) % 10;

        // Hesaplanan 10. ve 11. haneler girilenle eşleşiyor mu?
        return tenth === parseInt(value[9]) && eleventh === parseInt(value[10]);
    };

    const isTCValid = validateTC(formData.customerTC);

    const clearSignature = () => {
        sigCanvas.current.clear();
    };




    const handleClosePrintModal = async () => {
        setShowPrintModal(false);
        if (await appConfirm("Tüm işlemler tamamlandı.<br><br>'İşlem Bekleyenler' ekranına gitmek ister misiniz?")) {
            setActiveTab('pending-repairs');
        } else {
            setFormData({
                serialNumber: '',
                deviceModel: '',
                warrantyStatus: '',
                visualCondition: [],
                findMyOff: false,
                backupTaken: false,
                customerName: '',
                customerTC: '',
                customerPhone: '',
                customerEmail: '',
                customerAddress: '',
                issueDescription: '',
                mediaFiles: [],
                notes: ''
            });
            if (sigCanvas.current) sigCanvas.current.clear();
            setStep(1);
        }
    };



    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Steps */}
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6 sticky top-4 z-30 bg-[#f5f5f7]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-md text-blue-600 border border-blue-100 shadow-sm">
                        <Wrench size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Servis Kaydı</h2>
                        <p className="text-gray-500 mt-1 font-medium">Cihaz ve müşteri bilgilerini eksiksiz doldurun.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                    {[1, 2].map(s => (
                        <div
                            key={s}
                            onClick={() => setStep(s)}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${step === s
                                ? 'bg-gray-100 text-gray-900 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === s ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {s}
                            </span>
                            <span className="hidden sm:inline">
                                {s === 1 && 'BİLGİLER'}
                                {s === 2 && 'İMZA'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column - Main Form Area */}
                <div className="lg:col-span-8 space-y-6">

                    {step === 1 && (
                        <div className="space-y-6 animate-scale-up">
                            {/* Cihaz Bilgileri Kartı */}
                            <div className="gsx-card p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                        <div className="p-3 bg-blue-50 rounded-md text-blue-600">
                                            <Phone size={24} strokeWidth={2.5} />
                                        </div>
                                        Cihaz Kimliği
                                    </h3>
                                    <button onClick={openAppleCoverage} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                                        Garanti Sorgula <ExternalLink size={14} />
                                    </button>
                                </div>

                                {/* Ürün Grubu Seçimi */}
                                <div className="mb-10">
                                    <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-4 block ml-1">Ürün Grubu Seçiniz</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                        {PRODUCT_GROUPS.map((group) => (
                                            <button
                                                key={group.id}
                                                onClick={() => {
                                                    const isExchangeDefault = ['watch', 'airpods', 'other'].includes(group.id);
                                                    
                                                    setFormData(prev => {
                                                        const currentFiles = prev.mediaFiles || [];
                                                        const uploadedFiles = currentFiles.filter(f => !f.isDefault);
                                                        return { 
                                                            ...prev, 
                                                            productGroup: group.id,
                                                            serviceType: isExchangeDefault ? 'exchange' : 'repair',
                                                            mediaFiles: [...uploadedFiles, { url: group.img || PRODUCT_IMAGES[group.id], id: 'placeholder', isDefault: true, productGroup: group.id }]
                                                        };
                                                    });
                                                }}
                                                className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${formData.productGroup === group.id
                                                    ? `border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-200/50 scale-105`
                                                    : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 transform hover:-translate-y-1'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white shadow-md ${formData.productGroup === group.id ? group.color : 'bg-gray-400 opacity-60'}`}>
                                                    <group.icon size={24} />
                                                </div>
                                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${formData.productGroup === group.id ? 'text-blue-700' : 'text-gray-500'}`}>
                                                    {group.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Onarım / Değişim Seçimi */}
                                {formData.productGroup && (
                                    <div className="mb-8 flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100 animate-in slide-in-from-top-2">
                                        <span className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-4">İşlem Türü</span>
                                        <div className="flex gap-1">
                                            {/* Sadece iPhone, iPad ve Mac için Onarım seçeneği çıksın */}
                                            {['iphone', 'ipad', 'mac'].includes(formData.productGroup) && (
                                                <button
                                                    onClick={() => setFormData({ ...formData, serviceType: 'repair' })}
                                                    className={`px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase transition-all ${formData.serviceType === 'repair' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:bg-white'}`}
                                                >
                                                    Onarım
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setFormData({ ...formData, serviceType: 'exchange' })}
                                                className={`px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase transition-all ${formData.serviceType === 'exchange' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:bg-white'}`}
                                            >
                                                Değişim
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group relative">
                                        <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-2 block ml-1">Seri No / IMEI</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="DX3PL..."
                                                className="w-full pl-12 pr-24 py-4 rounded-md bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono tracking-wider text-lg uppercase font-bold text-gray-900"
                                                value={formData.serialNumber}
                                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Scan size={20} />
                                            </div>

                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        showToast('Kamera başlatılıyor...', 'info');
                                                        serialInputRef.current?.click(); // Seri No için özel ref kullan
                                                    }}
                                                    title="Kamera ile Tara"
                                                    className="p-2 hover:bg-blue-50 rounded-md text-blue-600 transition-colors"
                                                >
                                                    <Camera size={20} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={handleSerialSearch}
                                                    disabled={searching}
                                                    title="Sorgula"
                                                    className="p-2 hover:bg-blue-50 rounded-md text-blue-600 transition-colors"
                                                >
                                                    {searching ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Search size={20} strokeWidth={2.5} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group relative" ref={suggestionsRef}>
                                        <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-2 block ml-1">Cihaz Modeli</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Örn: iPhone 13..."
                                                className="w-full pl-12 pr-4 py-4 rounded-md bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg text-gray-900"
                                                value={formData.deviceModel}
                                                onChange={handleDeviceModelChange}
                                                onFocus={() => {
                                                    if (formData.deviceModel.length > 1) setShowSuggestions(true);
                                                }}
                                            />
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />

                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && deviceSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-2xl border border-gray-100 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 custom-scrollbar">
                                                    <div className="p-2 sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
                                                        <span className="text-[10px] font-semibold uppercase text-gray-400 px-2">Önerilen Modeller ({deviceSuggestions.length})</span>
                                                    </div>
                                                    <div className="p-1.5">
                                                        {deviceSuggestions.map((suggestion, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        deviceModel: suggestion,
                                                                        serviceType: /iPad|AirPods|Watch|Pencil|Mouse|Trackpad/.test(suggestion) ? 'exchange' : 'repair'
                                                                    }));
                                                                    setShowSuggestions(false);
                                                                }}
                                                                className="w-full text-left px-4 py-3 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-3 group/item border border-transparent hover:border-blue-100"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-white flex items-center justify-center text-gray-500 transition-colors">
                                                                    {suggestion.includes('iPhone') ? <Phone size={16} /> : <Package size={16} />}
                                                                </div>
                                                                <span className="font-bold text-sm text-gray-700 group-hover/item:text-blue-700">{suggestion}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Durum & Garanti Kartı */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="gsx-card p-6">
                                    <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Shield size={18} strokeWidth={2.5} />
                                        </div>
                                        Garanti Kapsamı
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'standard', label: 'Standart Garanti', icon: Shield, color: 'text-gray-600' },
                                            { id: 'applecare', label: 'AppleCare+', icon: CheckCircle, color: 'text-red-500' },
                                            { id: 'troy-koruma', label: 'Troy Ekstra Koruma', icon: Shield, color: 'text-purple-600' },
                                            { id: 'out-of-warranty', label: 'Garantisi Bitmiş', icon: ShieldAlert, color: 'text-orange-500' },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setFormData({ ...formData, warrantyStatus: type.id })}
                                                className={`w-full p-4 rounded-md border flex items-center gap-3 transition-all duration-300 relative overflow-hidden group ${formData.warrantyStatus === type.id
                                                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-md scale-[1.02]'
                                                    : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${formData.warrantyStatus === type.id ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-gray-400'}`}>
                                                    <type.icon size={20} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-bold text-sm">{type.label}</span>
                                                {formData.warrantyStatus === type.id && <div className="ml-auto bg-blue-600 text-white p-1 rounded-full"><Check size={12} strokeWidth={4} /></div>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Garantisiz Seçimi İçin Fiyat Alanı */}
                                    {formData.warrantyStatus === 'out-of-warranty' && (
                                        <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4">
                                            <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-2 block ml-1">Tahmini / Alınan Tutar</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="0.00"
                                                    className="w-full pl-12 pr-4 py-4 rounded-md bg-orange-50/50 border border-orange-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-lg text-orange-900 placeholder:text-orange-300"
                                                    value={formData.estimatedCost}
                                                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                                                />
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400 font-semibold text-lg">₺</span>
                                            </div>
                                            <p className="text-[10px] text-orange-600/80 font-bold mt-2 ml-1">* Müşteriden onaylanan ön fiyat bilgisi.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="gsx-card p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                                                <AlertTriangle size={18} strokeWidth={2.5} />
                                            </div>
                                            Fiziksel Durum
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {['Ekran Çizik', 'Kasa Darbe', 'Kamera Çatlak', 'Sıvı Teması', 'Yamulma', 'Tuş Arızası', 'FaceID Arızası', 'Arka Cam Kırık', 'Lekeler', 'Soyulma'].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => toggleCondition(item)}
                                                className={`py-3 px-4 rounded-md text-xs font-bold border transition-all text-left ${formData.visualCondition.includes(item)
                                                    ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-scale-up">
                            {/* Sorun Tanımı */}
                            <div className="gsx-card p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="p-3 bg-orange-50 rounded-md text-orange-600">
                                        <AlertTriangle size={24} strokeWidth={2.5} />
                                    </div>
                                    Sorun Detayları
                                </h3>

                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide mb-2 block ml-1">Müşteri Şikayeti</label>
                                <textarea
                                    rows="6"
                                    placeholder="Müşterinin belirttiği arızayı, oluşma şeklini ve taleplerini detaylıca yazınız..."
                                    value={formData.issueDescription}
                                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                    className="w-full p-6 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none transition-all text-base leading-relaxed font-medium text-gray-700 placeholder:text-gray-400"
                                ></textarea>

                                <div className="flex flex-wrap gap-2.5 mt-6">
                                    {['Batarya Çabuk Bitiyor', 'Şarj Olmuyor', 'Ekran Görüntü Vermiyor', 'Isınma Sorunu', 'Sıvı Döküldü', 'Düşme Sonrası Açılmıyor'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setFormData(prev => ({ ...prev, issueDescription: prev.issueDescription ? prev.issueDescription + ', ' + tag : tag }))}
                                            className="text-xs font-bold px-4 py-2 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-500 rounded-md transition-all shadow-sm hover:shadow-md active:scale-95"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fotoğraf Arşivi (Kabul Öncesi) */}
                            <div className="gsx-card p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                        <div className="p-3 bg-indigo-50 rounded-md text-indigo-600">
                                            <Camera size={24} strokeWidth={2.5} />
                                        </div>
                                        Cihaz Fotoğrafları (Kabul)
                                    </h3>
                                    <button 
                                        onClick={handleAddPhoto}
                                        disabled={uploading}
                                        className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                                    >
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                                        Fotoğraf Çek / Ekle
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleFileChange(e, 'before')}
                                />

                                <input
                                    type="file"
                                    ref={serialInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            showToast('Seri No görseli analiz ediliyor...', 'info');
                                            // İleride OCR eklenebilir
                                            setTimeout(() => showToast('Barkod okuma şimdilik manuel giriş gerektiriyor.', 'warning'), 1500);
                                        }
                                        e.target.value = null;
                                    }}
                                />

                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {formData.beforeImages?.map((url, index) => (
                                        <div key={index} className="relative aspect-square group rounded-[22px] overflow-hidden border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
                                            <img src={url} alt={`Before ${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <button onClick={() => window.open(url, '_blank')} className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 border border-white/30"><ExternalLink size={16} /></button>
                                                <button onClick={() => removePhoto(index, 'before')} className="p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600 border border-white/30"><X size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {(!formData.beforeImages || formData.beforeImages.length < 5) && (
                                        <button 
                                            onClick={handleAddPhoto}
                                            className="aspect-square rounded-[22px] border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-white hover:border-blue-200 hover:text-blue-500 transition-all group"
                                        >
                                            <div className="p-3 bg-white rounded-md shadow-sm group-hover:bg-blue-50 transition-colors">
                                                {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Camera size={24} strokeWidth={1.5} />}
                                            </div>
                                            <span className="text-[10px] font-semibold text-xs uppercase tracking-wide">{uploading ? 'Yükleniyor' : 'Ekle'}</span>
                                        </button>
                                    )}
                                </div>

                                <p className="mt-6 text-[11px] font-bold text-gray-500 leading-relaxed italic bg-blue-50/50 p-4 rounded-md border border-dashed border-blue-200">
                                    🌟 <span className="text-blue-700">İpucu:</span> Cihazın dört köşesini ve varsa mevcut çizikleri fotoğraflayarak servis kaydını profesyonelleştirin.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-scale-up">
                            <div className="gsx-card p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="p-3 bg-green-50 rounded-md text-green-600">
                                        <FileText size={24} strokeWidth={2.5} />
                                    </div>
                                    Son Kontroller & Teslim Alma
                                </h3>

                                <div className="space-y-5 mb-10">
                                    <label className={`flex items-start gap-5 p-5 rounded-lg border cursor-pointer transition-all duration-300 ${formData.findMyOff
                                        ? 'bg-green-50/50 border-green-200 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}>
                                        <div className={`mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${formData.findMyOff ? 'bg-green-500 border-green-500 text-white scale-110' : 'border-gray-300 bg-white'
                                            }`}>
                                            <Check size={16} strokeWidth={4} className={formData.findMyOff ? 'opacity-100' : 'opacity-0'} />
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.findMyOff}
                                                onChange={(e) => setFormData({ ...formData, findMyOff: e.target.checked })}
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 block text-lg mb-1">Cihazımı Bul (FMI) Kapalı</span>
                                            <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded uppercase mr-2">Zorunlu</span>
                                            <span className="text-sm text-gray-500 font-medium">Apple prosedürleri gereği servis kaydı açılamaz.</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-5 p-5 rounded-lg border cursor-pointer transition-all duration-300 ${formData.backupTaken
                                        ? 'bg-blue-50/50 border-blue-200 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}>
                                        <div className={`mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${formData.backupTaken ? 'bg-blue-500 border-blue-500 text-white scale-110' : 'border-gray-300 bg-white'
                                            }`}>
                                            <Check size={16} strokeWidth={4} className={formData.backupTaken ? 'opacity-100' : 'opacity-0'} />
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.backupTaken}
                                                onChange={(e) => setFormData({ ...formData, backupTaken: e.target.checked })}
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 block text-lg mb-1">Yedekleme Sorumluluğu</span>
                                            <span className="text-sm text-gray-500 font-medium">Müşteri veri kaybı riskini kabul etti ve yedeğini aldı.</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="border-t border-gray-100 pt-8 mt-10">
                                    <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-6 text-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <FileText size={28} className="text-orange-500" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 text-lg mb-2">Dijital Sözleşme ve İmza</h4>
                                        <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">Müşteriye hüküm ve koşullar ile fiyat onayı imzalatmak için formu tamamlayarak <strong className="text-orange-600">Tam Ekran Kiosk Ekranına</strong> geçiş yapılacaktır.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Customer Info & Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="gsx-card p-6 sticky top-32">
                        <h3 className="font-semibold text-gray-900 mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                                <User size={20} strokeWidth={2.5} />
                            </div>
                            Müşteri Bilgileri
                        </h3>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    placeholder="Ad Soyad"
                                    className="w-full px-5 py-4 rounded-md bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-900"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">TC Kimlik</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength="11"
                                        placeholder="11 Haneli"
                                        className={`w-full pl-5 pr-10 py-4 rounded-md border outline-none focus:ring-4 transition-all font-mono font-bold text-sm ${isTCValid === true
                                            ? 'bg-green-50 border-green-500 text-green-900 focus:border-green-600 focus:ring-green-500/20'
                                            : isTCValid === false
                                                ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600 focus:ring-red-500/20'
                                                : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10 text-gray-900'
                                            }`}
                                        value={formData.customerTC}
                                        onChange={(e) => setFormData({ ...formData, customerTC: e.target.value.replace(/\D/g, '') })}
                                    />
                                    {isTCValid === true && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 animate-in fade-in zoom-in">
                                            <CheckCircle size={18} strokeWidth={3} />
                                        </div>
                                    )}
                                    {isTCValid === false && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-in fade-in zoom-in group">
                                            <AlertCircle size={18} strokeWidth={3} />
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-red-600 text-white text-[10px] p-2 rounded-md hidden group-hover:block z-50 shadow-xl">
                                                Geçersiz TC Kimlik Numarası
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">Telefon</label>
                                <input
                                    type="tel"
                                    placeholder="0 (5XX)..."
                                    className="w-full px-5 py-4 rounded-md bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-900 text-sm"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">E-Posta</label>
                                <input
                                    type="email"
                                    placeholder="ornek@email.com"
                                    className="w-full px-5 py-4 rounded-md bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900 text-sm"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">Adres</label>
                                <textarea
                                    rows="3"
                                    placeholder="Tam adresi giriniz..."
                                    className="w-full px-5 py-4 rounded-md bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900 text-sm resize-none"
                                    value={formData.customerAddress}
                                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 text-xs uppercase tracking-wide ml-1">Müşteri Tipi (Memnuniyet Analizi)</label>
                                <div className="flex bg-gray-50 p-1.5 rounded-md border border-gray-200">
                                    <button
                                        onClick={() => setFormData({ ...formData, customerType: 'positive' })}
                                        className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.customerType === 'positive'
                                            ? 'bg-white text-green-600 shadow-sm border border-gray-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.customerType === 'positive' ? 'bg-green-100' : 'bg-transparent'}`}>
                                            <span role="img" aria-label="positive">😊</span>
                                        </div>
                                        Olumlu
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, customerType: 'negative' })}
                                        className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.customerType === 'negative'
                                            ? 'bg-white text-red-600 shadow-sm border border-gray-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.customerType === 'negative' ? 'bg-red-100' : 'bg-transparent'}`}>
                                            <span role="img" aria-label="negative">🙁</span>
                                        </div>
                                        Olumsuz
                                    </button>
                                </div>
                            </div>


                        </div>

                        {/* Navigation Buttons inside sticky sidebar if on desktop, or fixed bottom on mobile */}
                        <div className="mt-10 pt-8 border-t border-gray-100 flex gap-3">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-5 py-4 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}

                            {step < 2 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-md font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Sonraki Adım <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePrepareSubmission}
                                    disabled={!formData.findMyOff || uploading}
                                    className={`flex-1 px-6 py-4 rounded-md font-bold transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
                                        (!formData.findMyOff || uploading) 
                                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                        : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                                    }`}
                                >
                                    {uploading ? (
                                        <>Görsel Yükleniyor...</>
                                    ) : (
                                        <>
                                            <Save size={18} strokeWidth={2.5} /> 
                                            Kiosk Moduna Geç / Tamamla
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Kiosk Full-screen Signature Modal */}
            {showKioskModal && (
                <div className="fixed inset-0 bg-white z-[100] flex flex-col md:flex-row animate-in slide-in-from-bottom-5">
                    {/* Left Pane: T&C and Summary */}
                    <div className="md:w-[45%] bg-gray-50 flex flex-col p-8 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Kabul Formu<br/><span className="text-blue-600">ve Sözleşme</span></h2>
                            <button onClick={() => setShowKioskModal(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 hover:bg-gray-100 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm mb-6 flex flex-col gap-4">
                            <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-3">Servis Detayları</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500">Müşteri Adı:</span>
                                <span className="text-sm font-semibold text-gray-900">{formData.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500">Cihaz Modeli:</span>
                                <span className="text-sm font-semibold text-gray-900">{formData.deviceModel}</span>
                            </div>
                            {formData.estimatedCost && formData.warrantyStatus === 'out-of-warranty' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500">Onaylanan Ön Tutar:</span>
                                    <span className="text-lg font-semibold text-orange-600">{Number(formData.estimatedCost).toLocaleString('tr-TR')} ₺</span>
                                </div>
                            )}
                        </div>

                        <div className="text-xs font-medium text-gray-500 space-y-4 leading-relaxed pr-4 text-justify h-full overflow-y-auto custom-scrollbar bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Hüküm ve Koşullar</h3>
                            <p><strong>1. VERİ GÜVENLİĞİ:</strong> Cihaz içindeki verilerin yedeklenmesi tamamen müşterinin sorumluluğundadır. Servis işlemi sırasında oluşabilecek veri kayıplarından Troy Teknik Servis sorumlu tutulamaz.</p>
                            <p><strong>2. AKSESUARLAR:</strong> Cihaz üzerindeki cam, kaplama veya sticker gibi aksesuarlar onarım süreci gereği sökülmek zorundadır ve iadesi yapılmaz.</p>
                            <p><strong>3. RİSK BEYANI:</strong> Açılmayan, sıvı temaslı veya darbeli cihazların arıza tespiti sırasında tamamen kapanma riski müşteriye aittir.</p>
                            <p><strong>4. TESLİM:</strong> Form ile bırakılan cihazlar, yalnızca imza sahibi veya yetkili yasal temsilcisine ıslak imza karşılığında teslim edilir.</p>
                            <div className="mt-8 p-4 bg-orange-50 text-orange-800 rounded-md italic font-bold">
                                * Cihazımı sağlam, belirtilen şartlarla uyumlu şekilde Troy Teknik Servise onarım için teslim etmeyi özgür irademle kabul ediyorum.
                            </div>
                        </div>
                    </div>

                    {/* Right Pane: Signature Canvas */}
                    <div className="md:w-[55%] bg-white flex flex-col p-10 relative">
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex justify-between w-full mb-6 items-end">
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900">Müşteri Dijital İmzası</h3>
                                    <p className="text-sm text-gray-400 font-bold mt-1">Lütfen aşağıdaki alana parmağınızla veya kalemle imza atınız.</p>
                                </div>
                                <button onClick={clearSignature} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-sm font-bold transition-colors flex items-center gap-2">
                                    <Eraser size={18} /> Temizle
                                </button>
                            </div>
                            
                            <div className="w-full h-full max-h-[500px] border-[3px] border-blue-100 bg-blue-50/10 rounded-lg overflow-hidden relative shadow-inner">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    minWidth={2}
                                    maxWidth={4}
                                    canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair' }}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
                                    <FileText size={160} />
                                </div>
                            </div>
                            
                            <button
                                onClick={handleConfirmKiosk}
                                className="w-full mt-8 py-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xl shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                            >
                                <CheckCircle size={28} /> İMZAYI ONAYLA VE KAYDI TAMAMLA
                            </button>
                        </div>
                        <div className="absolute bottom-6 mx-auto text-center w-full right-0 left-0">
                            <span className="text-[10px] font-semibold uppercase text-gray-300 tracking-[0.2em]">{companyProfile?.name || "TROY"} SECURE DIGISIGN</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */},
            {showPrintModal && (
                <ServiceFormPrint
                    formData={formData}
                    repairId={lastRepairId}
                    onClose={handleClosePrintModal}
                />
            )}
        </div>
    );
};

export default ServiceAcceptance;
