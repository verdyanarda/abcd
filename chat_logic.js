// *** KONFIGURASI API GEMINI AI ***
const apiKey = "AIzaSyCdsDqEIKsb2YTuNea67jbtfjyJd7DoON4"; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
const model = "gemini-2.5-flash-preview-09-2025";

// *** LOGIKA CHAT & MEMORI ***
let chatHistory = [];
const systemInstruction = "Act as Arex AI, a professional and helpful assistant. Your responses should be clear, concise, and structured. Always use standard text formatting (like lists, paragraphs, and explicit HTML tags for code blocks) to make your answers easy to read. Respond in Indonesian. When generating code, always wrap it in triple backticks (```) followed by the language name.";

// Deklarasi variabel untuk elemen DOM (akan diinisialisasi dalam DOMContentLoaded)
let chatArea, userInput, sendBtn, loadingIndicator, newChatBtn;
let refineBtn, summarizeBtn;
let navChat, navHome, navContact;
let chatView, homeView, contactView;

// Fungsi untuk menampilkan pesan modal
function showAlert(title, message) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-container').classList.remove('hidden');
}

// FUNGSI COPY TO CLIPBOARD
function copyToClipboard(text, element) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;
    document.body.appendChild(textarea);
    textarea.select();
    
    let success = false;
    try {
        // Menggunakan document.execCommand('copy') untuk kompatibilitas iFrame
        success = document.execCommand('copy');
        
        if (success && element) {
            // Feedback visual
            const originalHTML = element.innerHTML;
            
            // Cek apakah tombol salin kode (punya <span>) atau salin pesan penuh (punya <svg>)
            const isCodeBtn = element.tagName === 'SPAN' || element.id.includes('copy-code');

            if (isCodeBtn) {
                element.innerHTML = `<svg class="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Tersalin`;
            } else {
                element.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`; 
            }


            setTimeout(() => {
                element.innerHTML = originalHTML;
            }, 1500);
        }
    } catch (err) {
        console.error('Could not copy text: ', err);
        showAlert('Gagal Menyalin', 'Fitur salin mungkin diblokir oleh browser. Silakan coba salin manual.');
    }
    document.body.removeChild(textarea);
    return success;
}

// FUNGSI PENTING: Mengganti Tampilan (View Switching)
function switchView(viewId) {
    // Pastikan elemen sudah diinisialisasi
    if (!navChat || !chatView) return; 

    // 1. Reset active state for all nav links
    [navChat, navHome, navContact].forEach(nav => {
        nav.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700', 'shadow-md');
        nav.classList.add('text-gray-600', 'hover:bg-gray-100');
    });

    // 2. Hide all views
    chatView.classList.add('hidden');
    homeView.classList.add('hidden');
    contactView.classList.add('hidden');

    // 3. Show selected view and highlight link
    if (viewId === 'chat') {
        chatView.classList.remove('hidden');
        navChat.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700', 'shadow-md');
    } else if (viewId === 'home') {
        homeView.classList.remove('hidden');
        navHome.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700', 'shadow-md');
    } else if (viewId === 'contact') {
        contactView.classList.remove('hidden');
        navContact.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700', 'shadow-md');
    }
}

// Fungsi untuk menambahkan pesan ke UI
function appendMessage(role, text) {
    const isUser = role === 'user';
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex', 'flex-row', 'items-start', 'p-3', 'rounded-lg', isUser ? 'justify-end' : 'justify-start', 'w-full');

    const avatar = document.createElement('div');
    avatar.classList.add('flex', 'items-center', 'justify-center', 'h-8', 'w-8', 'rounded-full', 'flex-shrink-0');
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('max-w-4xl');

    if (isUser) {
        // Pesan Pengguna (di sebelah kanan)
        avatar.classList.add('bg-blue-200', 'text-blue-800', 'ml-3');
        avatar.textContent = 'Me';
        messageContent.classList.add('user-message', 'order-1');
        messageWrapper.appendChild(messageContent);
        messageWrapper.appendChild(avatar);
        
        // Content for user message
        const pre = document.createElement('pre');
        pre.classList.add('whitespace-pre-wrap', 'text-sm');
        pre.textContent = text;
        messageContent.appendChild(pre);

    } else {
        // Pesan Arex AI (di sebelah kiri)
        avatar.classList.add('bg-indigo-500', 'text-white', 'mr-3');
        avatar.textContent = 'A';
        messageContent.classList.add('model-message', 'order-2');
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
        
        // --- LOGIKA Rendering Pesan Model dengan Tombol Salin ---
        const contentAndControls = document.createElement('div');
        contentAndControls.classList.add('relative');
        messageContent.appendChild(contentAndControls);

        // Tombol salin untuk SELURUH teks pesan
        const fullCopyBtn = document.createElement('button');
        fullCopyBtn.classList.add('copy-btn', 'absolute', 'top-1', 'right-1', 'p-1', 'rounded-full', 'text-gray-400', 'hover:bg-gray-200', 'transition-colors', 'z-10');
        fullCopyBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2"></path>
            </svg>`;
        
        fullCopyBtn.addEventListener('click', () => {
            copyToClipboard(text, fullCopyBtn);
        });
        contentAndControls.appendChild(fullCopyBtn);

        // Container untuk konten (mengkompensasi posisi tombol salin)
        const actualContent = document.createElement('div');
        actualContent.classList.add('pt-1', 'pr-4'); 
        contentAndControls.appendChild(actualContent);

        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        // 1. Iterasi dan pisahkan teks biasa dari blok kode
        while ((match = codeRegex.exec(text)) !== null) {
            
            // a. Teks biasa sebelum blok kode
            const plainText = text.substring(lastIndex, match.index).trim();
            if (plainText.length > 0) {
                const pre = document.createElement('pre');
                pre.classList.add('whitespace-pre-wrap', 'text-sm');
                pre.textContent = plainText;
                actualContent.appendChild(pre);
            }

            // b. Blok Kode
            const language = match[1] || 'Code';
            const codeBody = match[2].trim();
            
            // Outer container for code block
            const codeDiv = document.createElement('div');
            codeDiv.classList.add('code-block', 'rounded-lg', 'border', 'border-gray-200', 'my-3', 'overflow-hidden');

            // Header (Language + Copy Button for Code)
            const header = document.createElement('div');
            header.classList.add('flex', 'justify-between', 'items-center', 'bg-gray-100', 'px-4', 'py-2', 'text-xs', 'font-mono', 'text-gray-600', 'border-b', 'border-gray-200');
            
            // Language display
            const langSpan = document.createElement('span');
            langSpan.textContent = language;
            header.appendChild(langSpan);

            // Code Copy Button
            const codeCopyBtn = document.createElement('button');
            codeCopyBtn.id = 'copy-code-' + Date.now() + Math.random().toString(36).substring(7); // Unique ID
            codeCopyBtn.classList.add('flex', 'items-center', 'space-x-1', 'px-2', 'py-1', 'rounded', 'text-xs', 'font-medium', 'text-indigo-600', 'hover:bg-indigo-100', 'transition-colors');
            codeCopyBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2"></path>
                </svg>
                <span>Salin Kode</span>`;
            
            codeCopyBtn.addEventListener('click', () => {
                // Pass the button element itself for visual feedback
                copyToClipboard(codeBody, codeCopyBtn);
            });

            header.appendChild(codeCopyBtn);
            codeDiv.appendChild(header);

            // Code Content
            const codeContent = document.createElement('div');
            codeContent.classList.add('bg-gray-800', 'text-white', 'p-4', 'overflow-x-auto', 'text-xs', 'font-mono');
            const pre = document.createElement('pre');
            pre.classList.add('whitespace-pre-wrap');
            const code = document.createElement('code');
            code.textContent = codeBody;
            pre.appendChild(code);
            codeContent.appendChild(pre);
            codeDiv.appendChild(codeContent);
            
            actualContent.appendChild(codeDiv);

            lastIndex = match.index + match[0].length;
        }

        // c. Sisa teks setelah blok kode terakhir
        const remainingText = text.substring(lastIndex).trim();
        if (remainingText.length > 0 || actualContent.childElementCount === 0) {
            const pre = document.createElement('pre');
            pre.classList.add('whitespace-pre-wrap', 'text-sm');
            pre.textContent = remainingText;
            actualContent.appendChild(pre);
        }

    }
    
    messageContent.classList.add('text-sm');
    
    chatArea.appendChild(messageWrapper);
    
    // Auto-scroll ke bawah
    chatArea.scrollTop = chatArea.scrollHeight;
}

// FUNGSI API PUSAT DENGAN BACKOFF
async function apiCallWithBackoff(payload) {
    const headers = { 'Content-Type': 'application/json' };
    const MAX_RETRIES = 5;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            if (response.status === 429 && i < MAX_RETRIES - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error("Fetch attempt failed:", error);
            if (i === MAX_RETRIES - 1) {
                throw new Error('Gagal terhubung ke Gemini API setelah beberapa kali coba.');
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// FUNGSI UTAMA CHAT
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Tambahkan pesan pengguna ke UI dan history
    appendMessage('user', text);
    chatHistory.push({ role: 'user', parts: [{ text: text }] });

    // 2. Reset input dan tampilkan loading
    userInput.value = '';
    sendBtn.disabled = true;
    refineBtn.disabled = true; // Disable utilities during main chat
    summarizeBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    // 3. Siapkan payload API
    const payload = {
        contents: chatHistory, // Mengirim seluruh riwayat untuk memori
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
    };

    // 4. Panggil API
    try {
        const responseData = await apiCallWithBackoff(payload);
        
        // 5. Proses respons
        const modelText = responseData.candidates[0].content.parts[0].text;
        
        // 6. Tambahkan pesan Arex AI ke UI dan history
        appendMessage('model', modelText);
        chatHistory.push({ role: 'model', parts: [{ text: modelText }] });

    } catch (error) {
        showAlert('Error Respon', error.message || 'Gagal memproses respons dari Arex AI. Coba tanyakan pertanyaan yang berbeda.');
        // Hapus pesan pengguna terakhir dari history jika gagal mendapat balasan
        chatHistory.pop(); 
    } finally {
        loadingIndicator.classList.add('hidden');
        sendBtn.disabled = userInput.value.trim() === ''; // Re-check input for send button
        updateUtilityButtonStates(); // Update utility buttons
    }
}

// FUNGSI UTILITY 1: REFINE INPUT
async function refineInput() {
    const textToRefine = userInput.value.trim();
    if (!textToRefine) return;

    refineBtn.disabled = true;
    sendBtn.disabled = true;
    summarizeBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    const refinePrompt = `Tolong perhalus dan tingkatkan kejelasan teks ini. Ubah menjadi gaya yang profesional dan ringkas, dengan fokus pada koreksi tata bahasa dan nada, tanpa menambahkan konten substantif baru. Teks yang akan diperhalus: "${textToRefine}"`;

    const payload = {
        contents: [{ parts: [{ text: refinePrompt }] }],
        systemInstruction: {
            parts: [{ text: "You are a text refinement specialist. You only output the refined text." }]
        },
    };

    try {
        const responseData = await apiCallWithBackoff(payload);
        const refinedText = responseData.candidates[0].content.parts[0].text.trim();
        
        // Ganti teks di input box
        userInput.value = refinedText;
        
        // Beri feedback visual
        const originalHTML = refineBtn.innerHTML;
        refineBtn.innerHTML = '<span class="mr-1">✨</span> Selesai!';
        refineBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        refineBtn.classList.add('bg-green-600');
        setTimeout(() => {
            refineBtn.innerHTML = originalHTML;
            refineBtn.classList.remove('bg-green-600');
            refineBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        }, 1500);

    } catch (error) {
        showAlert('Error Refine', error.message || 'Gagal memperhalus teks.');
    } finally {
        loadingIndicator.classList.add('hidden');
        updateUtilityButtonStates();
        sendBtn.disabled = userInput.value.trim() === '';
    }
}

// FUNGSI UTILITY 2: SUMMARIZE LAST RESPONSE
async function summarizeLastResponse() {
    // Cari respons model terakhir
    const lastModelMessage = chatHistory.slice().reverse().find(m => m.role === 'model');
    if (!lastModelMessage) {
        showAlert('Peringatan', 'Tidak ada respons AI sebelumnya yang bisa diringkas.');
        return;
    }
    
    summarizeBtn.disabled = true;
    refineBtn.disabled = true;
    sendBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    
    const textToSummarize = lastModelMessage.parts[0].text;

    const summarizePrompt = `Tolong ringkas teks berikut menjadi 3 hingga 5 poin ringkas dan jelas dalam bahasa Indonesia. Teks yang akan diringkas: \n\n${textToSummarize}`;

    const payload = {
        contents: [{ parts: [{ text: summarizePrompt }] }],
        systemInstruction: {
            parts: [{ text: "You are a concise summarizer. Respond only with the summary content. Start with 'Ringkasan:'" }]
        },
    };

    try {
        const responseData = await apiCallWithBackoff(payload);
        const summaryText = responseData.candidates[0].content.parts[0].text;
        
        // Tambahkan ringkasan sebagai pesan baru dari model
        appendMessage('model', summaryText);
        chatHistory.push({ role: 'model', parts: [{ text: summaryText }] });

    } catch (error) {
        showAlert('Error Ringkasan', error.message || 'Gagal membuat ringkasan.');
    } finally {
        loadingIndicator.classList.add('hidden');
        updateUtilityButtonStates();
        sendBtn.disabled = userInput.value.trim() === '';
    }
}


// FUNGSI UNTUK MENGUPDATE STATUS TOMBOL UTILITAS
function updateUtilityButtonStates() {
    // Periksa apakah elemen sudah diinisialisasi
    if (!userInput || !refineBtn || !summarizeBtn) return;
    
    const inputHasText = userInput.value.trim().length > 0;
    const lastMessageIsModel = chatHistory.slice().reverse().find(m => m.role === 'model');
    
    // Refine Input: Aktif jika ada teks di input
    refineBtn.disabled = !inputHasText || loadingIndicator.classList.contains('hidden') === false;
    
    // Summarize Last Response: Aktif jika ada respons model sebelumnya
    summarizeBtn.disabled = !lastMessageIsModel || loadingIndicator.classList.contains('hidden') === false;
}

// Fungsi untuk memulai chat baru
function startNewChat() {
    chatHistory = [];
    chatArea.innerHTML = '';
    appendMessage('model', 'Percakapan baru telah dimulai. Saya Arex AI, asisten profesional Anda. Apa yang bisa saya bantu hari ini?');
    switchView('chat');
    updateUtilityButtonStates();
}

// *** INITIALIZATION DAN EVENT LISTENERS ***
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Elemen DOM (PENTING: DILAKUKAN DI SINI UNTUK MEMASTIKAN ELEMEN SUDAH DIMUAT)
    chatArea = document.getElementById('chat-area');
    userInput = document.getElementById('user-input');
    sendBtn = document.getElementById('send-btn');
    loadingIndicator = document.getElementById('loading-indicator');
    newChatBtn = document.getElementById('new-chat-btn');
    refineBtn = document.getElementById('refine-btn');
    summarizeBtn = document.getElementById('summarize-btn');
    
    // Navigasi & Views
    navChat = document.getElementById('nav-chat');
    navHome = document.getElementById('nav-home');
    navContact = document.getElementById('nav-contact');
    chatView = document.getElementById('chat-view');
    homeView = document.getElementById('home-view');
    contactView = document.getElementById('contact-view');

    // Modal Listener
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('modal-container').classList.add('hidden');
    });

    // 2. Attach Listeners untuk Navigasi (FIXED: Sekarang navHome, navChat, dll sudah pasti ada)
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('home');
    });
    navChat.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('chat');
    });
    navContact.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('contact');
    });
    newChatBtn.addEventListener('click', startNewChat);


    // 3. Listeners untuk input dan tombol kirim
    sendBtn.addEventListener('click', sendMessage);


      userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
            }
         }
      });

    // 4. Toggle tombol kirim dan tombol utilitas berdasarkan isi input
    userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
        updateUtilityButtonStates();
  });

    // 5. Initial State
    switchView('chat');
    updateUtilityButtonStates();
})