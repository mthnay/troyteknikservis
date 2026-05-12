const buildProductSvg = ({ label, accent, icon }) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#f8fafc"/>
                    <stop offset="100%" stop-color="#eef2f7"/>
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.16"/>
                </filter>
            </defs>
            <rect width="800" height="600" fill="url(#bg)"/>
            <circle cx="650" cy="80" r="130" fill="${accent}" opacity="0.12"/>
            <circle cx="110" cy="520" r="170" fill="${accent}" opacity="0.08"/>
            ${icon}
            <text x="400" y="525" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#111827">${label}</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PRODUCT_FALLBACKS = {
    iphone: buildProductSvg({
        label: 'iPhone',
        accent: '#2563eb',
        icon: '<rect x="300" y="105" width="200" height="330" rx="42" fill="#111827" filter="url(#shadow)"/><rect x="318" y="132" width="164" height="276" rx="28" fill="#f9fafb"/><rect x="365" y="118" width="70" height="8" rx="4" fill="#374151"/><circle cx="400" cy="420" r="9" fill="#374151"/>'
    }),
    ipad: buildProductSvg({
        label: 'iPad',
        accent: '#4f46e5',
        icon: '<rect x="230" y="115" width="340" height="285" rx="34" fill="#111827" filter="url(#shadow)"/><rect x="253" y="140" width="294" height="235" rx="18" fill="#f9fafb"/><circle cx="400" cy="387" r="8" fill="#374151"/>'
    }),
    mac: buildProductSvg({
        label: 'Mac',
        accent: '#475569',
        icon: '<rect x="245" y="130" width="310" height="210" rx="18" fill="#111827" filter="url(#shadow)"/><rect x="265" y="150" width="270" height="165" rx="8" fill="#f9fafb"/><path d="M190 372h420l-38 55H228z" fill="#cbd5e1" filter="url(#shadow)"/><path d="M318 372h164l18 26H300z" fill="#94a3b8"/>'
    }),
    watch: buildProductSvg({
        label: 'Apple Watch',
        accent: '#ea580c',
        icon: '<rect x="350" y="70" width="100" height="95" rx="28" fill="#cbd5e1"/><rect x="350" y="355" width="100" height="95" rx="28" fill="#cbd5e1"/><rect x="300" y="145" width="200" height="230" rx="54" fill="#111827" filter="url(#shadow)"/><rect x="322" y="168" width="156" height="184" rx="38" fill="#f9fafb"/><rect x="498" y="230" width="16" height="58" rx="8" fill="#64748b"/>'
    }),
    airpods: buildProductSvg({
        label: 'AirPods',
        accent: '#059669',
        icon: '<path d="M310 145c-42 0-76 33-76 74 0 34 23 63 55 72v108c0 22 18 40 40 40s40-18 40-40V205c0-33-27-60-59-60z" fill="#f9fafb" stroke="#cbd5e1" stroke-width="16" filter="url(#shadow)"/><path d="M490 145c42 0 76 33 76 74 0 34-23 63-55 72v108c0 22-18 40-40 40s-40-18-40-40V205c0-33 27-60 59-60z" fill="#f9fafb" stroke="#cbd5e1" stroke-width="16" filter="url(#shadow)"/>'
    }),
    other: buildProductSvg({
        label: 'Aksesuar',
        accent: '#7c3aed',
        icon: '<rect x="255" y="170" width="290" height="220" rx="32" fill="#f9fafb" stroke="#cbd5e1" stroke-width="16" filter="url(#shadow)"/><path d="M315 255h170M315 305h120" stroke="#7c3aed" stroke-width="24" stroke-linecap="round"/><circle cx="510" cy="205" r="42" fill="#7c3aed" opacity="0.2"/>'
    })
};

const PRODUCT_PHOTOS = {
    iphone: '/product-images/iphone.jpg',
    ipad: '/product-images/ipad.jpg',
    mac: '/product-images/mac.jpg',
    watch: '/product-images/watch.jpg',
    airpods: '/product-images/airpods.jpg',
    other: '/product-images/accessory.jpg'
};

export const getProductImage = (group = '', model = '') => {
    const groupLower = (group || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const fullText = `${groupLower} ${modelLower}`;

    // iPhone Serisi
    if (fullText.includes('iphone')) {
        return PRODUCT_PHOTOS.iphone || PRODUCT_FALLBACKS.iphone;
    }
    
    // Mac / MacBook Serisi
    if (fullText.includes('mac') || fullText.includes('bilgisayar')) {
        return PRODUCT_PHOTOS.mac || PRODUCT_FALLBACKS.mac;
    }
    
    // iPad Serisi
    if (fullText.includes('ipad') || fullText.includes('tablet')) {
        return PRODUCT_PHOTOS.ipad || PRODUCT_FALLBACKS.ipad;
    }
    
    // Watch Serisii
    if (fullText.includes('watch') || fullText.includes('saat')) {
        return PRODUCT_PHOTOS.watch || PRODUCT_FALLBACKS.watch;
    }
    
    // Ses / AirPods / Beats
    if (fullText.includes('airpods') || fullText.includes('ses') || fullText.includes('audio') || fullText.includes('kulaklık') || fullText.includes('beats')) {
        return PRODUCT_PHOTOS.airpods || PRODUCT_FALLBACKS.airpods;
    }

    // Parça / Teknik Görseller
    if (fullText.includes('parça') || fullText.includes('ekran') || fullText.includes('pil') || fullText.includes('batarya')) {
        return PRODUCT_PHOTOS.other || PRODUCT_FALLBACKS.other;
    }

    // Varsayılan: Teknoloji/Servis Temalı Şık Bir Görsel
    return PRODUCT_PHOTOS.other || PRODUCT_FALLBACKS.other;
};

export const getSafeRepairImageUrl = (imagePath, group, model, apiUrl) => {
    const fallback = getProductImage(group, model);
    
    if (!imagePath || typeof imagePath !== 'string') return fallback;
    
    // Check for known dead/example domains
    const isDeadLink = imagePath.includes('officialapple.store') ||
                       imagePath.includes('img.icons8.com') ||
                       imagePath.includes('images.unsplash.com') ||
                       imagePath.includes('example.com') ||
                       imagePath.includes('broken-link');

    if (isDeadLink) return fallback;

    // Full URLs or Data URIs
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }

    // Relative paths from backend
    // Normalize path by removing leading slash
    const cleanPath = imagePath.replace(/^\//, '');
    
    // Construct base URL
    const baseUrl = (apiUrl || 'http://localhost:5001/api').replace('/api', '');
    
    // If it's just a filename, prepend /uploads/
    if (!cleanPath.startsWith('uploads/')) {
        return `${baseUrl}/uploads/${cleanPath}`;
    }
    
    return `${baseUrl}/${cleanPath}`;
};
