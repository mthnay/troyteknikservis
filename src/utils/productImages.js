export const getProductImage = (group = '', model = '') => {
    const groupLower = (group || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const fullText = `${groupLower} ${modelLower}`;

    // iPhone Serisi
    if (fullText.includes('iphone')) {
        return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba3f21?q=80&w=800&auto=format&fit=crop';
    }
    
    // Mac / MacBook Serisi
    if (fullText.includes('mac') || fullText.includes('bilgisayar')) {
        return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop';
    }
    
    // iPad Serisi
    if (fullText.includes('ipad') || fullText.includes('tablet')) {
        return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop';
    }
    
    // Watch Serisii
    if (fullText.includes('watch') || fullText.includes('saat')) {
        return 'https://images.unsplash.com/photo-1517502474567-4828317145d3?q=80&w=800&auto=format&fit=crop';
    }
    
    // Ses / AirPods / Beats
    if (fullText.includes('airpods') || fullText.includes('ses') || fullText.includes('audio') || fullText.includes('kulaklık') || fullText.includes('beats')) {
        return 'https://images.unsplash.com/photo-1588156979435-379b9d802b0a?q=80&w=800&auto=format&fit=crop';
    }

    // Parça / Teknik Görseller
    if (fullText.includes('parça') || fullText.includes('ekran') || fullText.includes('pil') || fullText.includes('batarya')) {
        return 'https://images.unsplash.com/photo-1591405351990-4726e33df58d?q=80&w=800&auto=format&fit=crop';
    }

    // Varsayılan: Teknoloji/Servis Temalı Şık Bir Görsel
    return 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=800&auto=format&fit=crop';
};
