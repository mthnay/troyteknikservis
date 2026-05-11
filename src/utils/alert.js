import Swal from 'sweetalert2';

export const appAlert = (message, type = 'info') => {
    return Swal.fire({
        title: type === 'error' ? 'Hata' : type === 'success' ? 'Başarılı' : 'Bilgi',
        text: message,
        icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
        confirmButtonText: 'Tamam',
        confirmButtonColor: '#007aff',
        customClass: {
            popup: 'rounded-[32px] shadow-2xl border border-gray-100 font-sans',
            title: 'font-black text-xl text-gray-900',
            htmlContainer: 'text-gray-600 font-medium',
            confirmButton: 'rounded-xl font-bold px-8 py-3 shadow-md hover:shadow-lg transition-all'
        }
    });
};

export const appConfirm = (message) => {
    return Swal.fire({
        title: 'Emin misiniz?',
        html: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#34c759',
        cancelButtonColor: '#ff3b30',
        confirmButtonText: 'Evet, Onayla',
        cancelButtonText: 'İptal',
        customClass: {
            popup: 'rounded-[32px] shadow-2xl border border-gray-100 font-sans',
            title: 'font-black text-xl text-gray-900',
            htmlContainer: 'text-gray-600 font-medium',
            confirmButton: 'rounded-xl font-bold px-6 py-3 shadow-md hover:shadow-lg transition-all',
            cancelButton: 'rounded-xl font-bold px-6 py-3 border border-gray-200 bg-white text-red-500 hover:bg-gray-50'
        }
    }).then((result) => result.isConfirmed);
};

export const appPrompt = (message) => {
    return Swal.fire({
        title: 'Bilgi Girişi',
        text: message,
        input: 'text',
        showCancelButton: true,
        confirmButtonColor: '#007aff',
        cancelButtonColor: '#8e8e93',
        confirmButtonText: 'Kaydet',
        cancelButtonText: 'İptal',
        customClass: {
            popup: 'rounded-[32px] shadow-2xl border border-gray-100 font-sans',
            title: 'font-black text-xl text-gray-900',
            htmlContainer: 'text-gray-600 font-medium',
            input: 'rounded-xl border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50',
            confirmButton: 'rounded-xl font-bold px-6 py-3 shadow-md hover:shadow-lg transition-all',
            cancelButton: 'rounded-xl font-bold px-6 py-3 border border-gray-200'
        }
    }).then((result) => result.value);
};
