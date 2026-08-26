    let isNavigating = false;
    let touchStartX = 0;
    let touchEndX = 0;
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let actionInterval = null;
    let actionTimeout = null;
    let editor, highlighter, lineNums;
    let colorIndex = 0;
    let currentTab = 'html';
    let projectFiles = [
    { name: 'index.html', type: 'html', content: '', history: [''], redo: [] },
    { name: 'style.css', type: 'css', content: '', history: [''], redo: [] },
    { name: 'script.js', type: 'js', content: '', history: [''], redo: [] } ];
    let currentFileIndex = 0;
    const maxHistory = 120;
    const ghostTemplates = {
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <style>\n       body { \n          background: #f2eeed; \n          color: #333; \n          display: flex; \n          justify-content: center; \n          align-items: center; \n          height: 100vh; \n          margin: 0; }\n    </style>\n</head>\n<body>\n    <script>\n    <\/script>\n</body>\n</html>`,
        css: `body { \n          background: #f2eeed; \n          color: #333; \n          display: flex; \n          justify-content: center; \n          align-items: center; \n          height: 100vh; \n          margin: 0; }\n}`
    };
    const colors = ['#ed4a4a', '#f2da1f', '#2c73d1', '#60cc3f'];
    const LINE_HEIGHT = 21; 
    const VISIBLE_LINES = 50;
    const tx = document.querySelector('textarea');

tx.addEventListener('select', (e) => {
}, { passive: false });
tx.addEventListener('touchmove', (e) => {
    if (document.activeElement === tx) {
        e.stopPropagation();
    }
}, { passive: true });

const fileMap = {};
projectFiles.forEach(file => {
    let mimeType = 'text/plain';
    if (file.type === 'html') mimeType = 'text/html';
    if (file.type === 'css') mimeType = 'text/css';
    if (file.type === 'js') mimeType = 'application/javascript';
    if (file.type === 'json') mimeType = 'application/json';

    const blob = new Blob([file.content], { type: mimeType });
    fileMap[file.name] = URL.createObjectURL(blob);
});

/*function renderVirtual() {
    const scrollTop = editorContainer.scrollTop;
    const startLine = Math.floor(scrollTop / LINE_HEIGHT);
    const lines = fullContent.split('\n');
    
    const visibleChunk = lines.slice(startLine, startLine + VISIBLE_LINES).join('\n');
    editor.value = visibleChunk;
    highlighter.innerHTML = tinyHighlight(visibleChunk);

    const offset = startLine * LINE_HEIGHT;
    const transformStyle = `translateY(${offset}px)`;
    editor.style.transform = transformStyle;
    highlighter.style.transform = transformStyle;
    updateLineNumbers(startLine);
}*/

function updateLineNumbers(start) {
    let numbers = "";
    for (let i = 0; i < VISIBLE_LINES; i++) {
        numbers += (start + i + 1) + "<br>";
    }
    lineNums.innerHTML = numbers;
}

    window.onload = () => {
        editor = document.getElementById('editor');
        highlighter = document.getElementById('highlighting');
        lineNums = document.getElementById('line-numbers');
        renderFileList();
editor.addEventListener('touchstart', (e) => {
    // Jeśli dotkniesz dwoma palcami - zaczynamy zaznaczanie
    if (e.touches.length === 1) {
        const pos = editor.selectionStart; // Pobieramy pozycję kursora
        vSelStart = pos;
        vSelEnd = pos;
    }
});

editor.addEventListener('touchmove', (e) => {
    // Podczas ruchu palcem aktualizujemy koniec zaznaczenia
    // Android będzie teraz płynnie rysował Twoją zieloną strefę
    const pos = editor.selectionStart; 
    vSelEnd = pos;
    updateText(editor.value);
});

// Aby to działało idealnie, musimy oszukać Androida, że edytor jest w trybie 'read-only' 
// podczas zaznaczania, żeby nie wywalał klawiatury w kosmos.


// Krytyczne dla Androida: po zakończeniu dotyku (przesunięciu kropli)
editor.addEventListener('touchend', () => {
    if (lockedSelection.active) {
        // Małe opóźnienie, żeby dać systemowi czas na zakończenie natywnych procesów
        setTimeout(enforceSelection, 10);
    }
});

        editor.addEventListener('scroll', () => {
            highlighter.scrollTop = editor.scrollTop;
            highlighter.scrollLeft = editor.scrollLeft;
            lineNums.scrollTop = editor.scrollTop;
        });

      editor.addEventListener('input', () => {
    updateLines();
    updateText(editor.value);
    // Poprawka: Zapisujemy treść editor.value, a nie pusty string!
    const file = projectFiles.find(f => f.type === currentTab);
    if(file) file.content = editor.value; 
    saveState();
});
        
        updateLines();
      editor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;

            this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            
            updateText(this.value);
            updateLines();
            saveState();
        }
    });
    editor.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const pos = this.selectionStart;
        const text = this.value;
        const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
        const currentLine = text.substring(lineStart, pos);
        const indent = currentLine.match(/^\s*/)[0];

        const newText = "\n" + indent;
        this.value = text.substring(0, pos) + newText + text.substring(pos);
        this.selectionStart = this.selectionEnd = pos + newText.length;
        
        updateText(this.value);
        updateLines();
        saveState();
    }
});

editor.addEventListener('click', function(e) {
    if (e.detail === 3) {
        // Sprawdzamy, czy edytor jest pusty ORAZ czy mamy szablon dla tego taba
        if (this.value.trim() === "" && ghostTemplates[currentTab]) {
            const template = ghostTemplates[currentTab];
            
            this.value = template;
            updateText(template);
            updateLines();
            saveState();
            if (typeof updateMarker === 'function') updateMarker();
        } else {
            // Twoja standardowa logika zaznaczania linii (detail === 3)
            const pos = this.selectionStart;
            const lines = this.value.split('\n');
            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                const start = charCount;
                const end = charCount + lines[i].length;
                if (pos >= start && pos <= end) {
                    this.setSelectionRange(start, end);
                    break;
                }
                charCount = end + 1;
            }
        }
  }
});

// Mapowanie akcji na konkretne funkcje w Twoim kodzie
const toolbarActions = {
    console: () => { if (typeof toggleConsole === 'function') toggleConsole(); }, // Zakładam, że console panel ma toggle
    paste: () => { paste(); },
    trash: () => { trash(); },
    undo: () => { undo(); },
    redo: () => { redo(); },
    bars: () => { bars(); },
    save: () => { if (typeof save === 'function') save(); },
    export: () => { exportAndShare(); }
};

const toolbar = document.getElementById('main-toolbar');

// Jeden Event Listener zarządzający całym panelem
toolbar.addEventListener('click', (e) => {
    // 1. Obsługa przycisków akcji (ikonek)
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (toolbarActions[action]) {
            toolbarActions[action]();
        }
        
        // Animacja kliknięcia ikony, którą miałeś na dole kodu
        actionBtn.classList.remove('tab-icon-click');
        void actionBtn.offsetWidth;
        actionBtn.classList.add('tab-icon-click');
        return;
    }

    // 2. Obsługa przełączania kart (Tabów)
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
        const targetTab = tabBtn.dataset.tab;
        switchTab(targetTab);
    }
});

// Obsługa continuous action (przytrzymanie undo/redo) przeniesiona do delegacji zdarzeń
toolbar.addEventListener('touchstart', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'undo') startContinuousAction(undo);
        if (action === 'redo') startContinuousAction(redo);
    }
}, { passive: true });

toolbar.addEventListener('touchend', () => {
    stopContinuousAction();
});

// Dla myszki na desktopie
toolbar.addEventListener('mousedown', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'undo') startContinuousAction(undo);
        if (action === 'redo') startContinuousAction(redo);
    }
});

toolbar.addEventListener('mouseup', () => {
    stopContinuousAction();
});

editor.addEventListener('click', function(e) {
    if (e.detail === 3) {
        const pos = this.selectionStart;
        const lines = this.value.split('\n');
        let charCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const start = charCount;
            const end = charCount + lines[i].length;
            if (pos >= start && pos <= end) {
                const firstChar = lines[i].search(/\S/);
                const selectionStart = (firstChar === -1) ? start : start + firstChar;
                this.setSelectionRange(selectionStart, end);
                break;
            }
            charCount = end + 1;
        }
    }
});

lineNums.style.pointerEvents = "auto"; 
        lineNums.addEventListener('touchstart', (e) => {
            const wrapper = document.querySelector('.editor-wrapper');
            const rect = lineNums.getBoundingClientRect();
            const touchY = e.touches[0].clientY - rect.top + lineNums.scrollTop;
            const isTop = (e.touches[0].clientY - rect.top) < rect.height / 2;
            const lineIndex = Math.floor(touchY / LINE_HEIGHT);
            const lines = editor.value.split('\n');
            const targetLine = Math.min(lines.length - 1, Math.max(0, lineIndex));
            const pos = lines.slice(0, targetLine).join('\n').length + (targetLine > 0 ? 1 : 0);
            
            editor.focus();
            editor.setSelectionRange(pos, pos);

            lineLongPress = setTimeout(() => {
              wrapper.classList.add('fast-scroll-active');
        lineNums.classList.add('scrolling');
                if (isTop) {
            editor.scrollTo({top: 0, behavior: 'smooth'});
            editor.setSelectionRange(0, 0);
        } else {
            editor.scrollTo({top: editor.scrollHeight, behavior: 'smooth'});
            const len = editor.value.length;
            editor.setSelectionRange(len, len);
        }
setTimeout(() => {
            wrapper.classList.remove('fast-scroll-active');
            lineNums.classList.remove('scrolling');
        }, 500);
    }, 400);
            if (e.touches.length > 1) {
              const endPos = lines.slice(0, targetLine + 1).join('\n').length;
        editor.setSelectionRange(editor.selectionStart, endPos);
    }
        }, {passive: true});

        lineNums.addEventListener('touchend', () => {
    clearTimeout(lineLongPress);
    const wrapper = document.querySelector('.editor-wrapper');
    wrapper.classList.remove('fast-scroll-active');
    lineNums.classList.remove('scrolling');
});
        const marker = document.getElementById('line-marker');

const updateMarker = () => {
    const pos = editor.selectionStart;
    const text = editor.value.substring(0, pos);
    const lineIndex = text.split('\n').length - 1;
    
    const lineHeight = 22;
    const paddingTop = 10;
    const scrollOffset = editor.scrollTop;
    const finalTop = (lineIndex * lineHeight) + paddingTop - scrollOffset + 8;

    const containerHeight = document.querySelector('.editor-container').offsetHeight;
    if (finalTop < 0 || finalTop > containerHeight - 10) {
        marker.style.opacity = "0";
    } else {
        marker.style.opacity = "1";
        marker.style.top = finalTop + 'px';
    }
};

editor.addEventListener('input', updateMarker);
editor.addEventListener('click', updateMarker);
editor.addEventListener('keyup', updateMarker);
editor.addEventListener('scroll', updateMarker);
};

    setInterval(() => {
        colorIndex = (colorIndex + 1) % colors.length;
        document.documentElement.style.setProperty('--current-cursor-color', colors[colorIndex]);
    }, 1000);

    function updateLines() {
    if (!editor || !lineNums) return;
    
    const lines = editor.value.split('\n').length;
    
    // Optymalizacja: Generujemy ciąg liczb tylko jeśli liczba linii się zmieniła
    // Zapobiega to niepotrzebnemu renderowaniu DOM przy samym pisaniu w jednej linii
    if (lineNums.dataset.rowCount != lines) {
        let lineNumbersHtml = '';
        for (let i = 1; i <= lines; i++) {
            lineNumbersHtml += i + '\n';
        }
        lineNums.textContent = lineNumbersHtml;
        lineNums.dataset.rowCount = lines;
    }
    
    lineNums.scrollTop = editor.scrollTop;
}

    function tinyHighlight(text) {
    if (!text) return "";
    let escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return escaped.replace(/(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/|\/\/.*)|(["'].*?["'])|(#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])|rgba?\([^)]+\)|hsla?\([^)]+\))|(&lt;\/?[a-zA-Z0-9\-:]+|&gt;)|\b(function|const|let|var|return|if|else|for|while|switch|case|style|script)\b|([.!#{}])/gi, 
    function(match, comment, string, color, tag, keyword, punct) {
        if (comment) return '<span class="token comment">' + match + '</span>';
        
        if (string) {
            let inner = match.replace(/(#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])|rgba?\([^)]+\)|hsla?\([^)]+\))/gi, (c) => {
                return `<span class="color-preview" style="background: ${c};"></span>${c}`;
            });
            return '<span class="token string">' + inner + '</span>';
        }
        
        if (color) {
            return `<span class="color-preview" style="background: ${match};"></span><span class="token string">${match}</span>`;
        }
        
        if (tag) return '<span class="token tag">' + match + '</span>';
        if (keyword) return '<span class="token keyword">' + match + '</span>';
        
        if (punct) {
            if (match === '.') {
                if (currentTab === 'js') return match;
                if (currentTab === 'css') return '<span class="token punctuation">' + match + '</span>';
            }
            if (match === '#') {
                if (currentTab === 'js') return match;
                if (currentTab === 'css') return '<span class="token punctuation">' + match + '</span>';
            }
            
            if (match === '#' && currentTab === 'css') {
                return '<span class="token tag">' + match + '</span>';
            }

            return '<span class="token punctuation">' + match + '</span>';
        }
        
        return match;
    });
}

    let vSelStart = null;
let vSelEnd = null;

let updateTextTimeout = null;
let lastLength = 0;

function updateText(text) {
    clearTimeout(updateTextTimeout);
    const container = document.getElementById("highlighting-content");
    if (!container) return;
    const render = () => {
        if (vSelStart !== null && vSelEnd !== null) {
            const start = Math.min(vSelStart, vSelEnd);
            const end = Math.max(vSelStart, vSelEnd);
            const before = text.substring(0, start);
            const selected = text.substring(start, end);
            const after = text.substring(end);
            container.innerHTML = 
                tinyHighlight(before) + 
                `<span class="virtual-selection">${tinyHighlight(selected)}</span>` + 
                tinyHighlight(after);
        } else {
            container.innerHTML = tinyHighlight(text);
        }
        lastLength = text.length;
    };
    if (text.length < lastLength || Math.abs(text.length - lastLength) === 1) {
        render();
    } else {
        updateTextTimeout = setTimeout(render, 40);
    }
}

let lockedSelection = { start: 0, end: 0, active: false };

function syncSelection() {
    // Jeśli nic nie jest zaznaczone (kursor to punkt), nie blokujemy
    if (editor.selectionStart === editor.selectionEnd) {
        lockedSelection.active = false;
        return;
    }

    // Jeśli użytkownik właśnie zaznaczył tekst, zapamiętujemy to
    lockedSelection.start = editor.selectionStart;
    lockedSelection.end = editor.selectionEnd;
    lockedSelection.active = true;
}

// Funkcja wymuszająca powrót zaznaczenia
function enforceSelection() {
    if (lockedSelection.active && document.activeElement === editor) {
        // Sprawdzamy czy obecne zaznaczenie różni się od zapamiętanego
        if (editor.selectionStart !== lockedSelection.start || editor.selectionEnd !== lockedSelection.end) {
            editor.setSelectionRange(lockedSelection.start, lockedSelection.end);
        }
    }
}

    function switchTab(tab) {
    if (currentTab === tab) return;

    // 1. Zapis stanu przed zmianą
    const currentFile = projectFiles.find(f => f.type === currentTab);
    if (currentFile) currentFile.content = editor.value;

    const wrapper = document.querySelector('.editor-wrapper');
    const animEl = document.getElementById('tab-anim');
    
    animEl.classList.remove('animate-tab');
    void animEl.offsetWidth; 
    animEl.classList.add('animate-tab');
    wrapper.classList.add('content-blur');

    // 2. Aktualizacja UI kart - Poprawiona logika
    const tabElements = document.querySelectorAll('.tabs .tab');
    tabElements.forEach(t => {
    const isTarget = t.getAttribute('data-tab') === tab;
      t.classList.toggle('active', isTarget);
      t.setAttribute('aria-selected', isTarget);
      t.setAttribute('aria-hidden', !isTarget);
});


    currentTab = tab;

    // 3. Ładowanie nowej treści
    setTimeout(() => {
        const nextFile = projectFiles.find(f => f.type === tab);
        editor.value = nextFile ? nextFile.content : '';
        updateText(editor.value);
        updateLines();
        wrapper.classList.remove('content-blur');
        editor.scrollTop = 0;
        if (typeof updateMarker === 'function') updateMarker();
    }, 100);
}

const tabsContainer = document.querySelector('.tabs');
tabsContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

tabsContainer.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const swipeThreshold = 35; 
    const tabOrder = ['css', 'html', 'js'];
    let currentIndex = tabOrder.indexOf(currentTab);

    if (touchEndX - touchStartX > swipeThreshold) {
        let nextIndex = (currentIndex + 1) % tabOrder.length; 
        switchTab(tabOrder[nextIndex]);
    }
    
    else if (touchStartX - touchEndX > swipeThreshold) {
        let prevIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
        switchTab(tabOrder[prevIndex]);
    }
}
    
    function runPreview() {
    const container = document.getElementById('preview-container');
    const frame = document.getElementById('preview-frame');
    const handle = document.getElementById('preview-handle');
    const getMimeType = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const essentialMap = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json'
        };
        // Wszystko inne, co wymyślisz (.gl, .glass, .c), idzie jako tekst
        return essentialMap[ext] || 'text/plain';
    };

    // 1. Reset interakcji - to naprawia "klikanie pod spodem"
    container.style.display = 'flex';
    container.style.pointerEvents = 'auto'; 
    frame.style.pointerEvents = 'auto';
    if (handle) handle.style.pointerEvents = 'auto';
    
    // 2. Synchronizacja bieżącego edytora
    const currentFile = projectFiles.find(f => f.type === currentTab);
    if(currentFile) currentFile.content = editor.value;

    // 3. Mapowanie plików na Bloby
    projectFiles.forEach(file => {
        const mimeType = getMimeType(file.name);
        if (fileMap[file.name]) URL.revokeObjectURL(fileMap[file.name]);
        fileMap[file.name] = URL.createObjectURL(new Blob([file.content], { type: mimeType }));
    });

    // 4. Pobranie głównego pliku HTML
    let mainHtmlFile = projectFiles.find(f => f.name === 'index.html' || f.type === 'html');
    let htmlContent = mainHtmlFile ? mainHtmlFile.content : '';

    Object.keys(fileMap).forEach(fileName => {
        const blobUrl = fileMap[fileName];
        const regex = new RegExp(`(src|href)=["'](\\.\\/|\\/)?${fileName}["']`, 'g');
        htmlContent = htmlContent.replace(regex, `$1="${blobUrl}"`);
    });

    // 6. Renderowanie zawartości w iframe
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // 7. Ostateczne upewnienie się, że iframe ma focus i jest klikalny
    setTimeout(() => {
        frame.focus();
    }, 50);
}
    function closePreview() {
        document.getElementById('preview-container').style.display = 'none';
    }

function initDrag() {
    const container = document.getElementById('preview-container');
    const handle = document.getElementById('preview-handle');
    const iframe = document.getElementById('preview-frame');

    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        container.style.transition = 'none';
        
        container.style.pointerEvents = 'none';
        handle.style.pointerEvents = 'auto'; 
        iframe.style.pointerEvents = 'none';
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY - startY;
        if (currentY > 0) {
            container.style.transform = `translateY(${currentY}px)`;
            container.style.opacity = "0.9";
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        container.style.opacity = "1";
        container.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        
        if (currentY > window.innerHeight / 2) {
            closePreview();
        } else {
            container.style.transform = 'translateY(0)';
            container.style.pointerEvents = 'auto';
            iframe.style.pointerEvents = 'auto';
        }
        currentY = 0;
    });
}

window.addEventListener('DOMContentLoaded', initDrag);

function closePreview() {
    const container = document.getElementById('preview-container');
    container.style.display = 'none';
    container.style.transform = 'translateY(0)';
}

    function saveState() {
    const file = projectFiles[currentFileIndex];
    if (!file) return;

    // Zapisujemy tylko jeśli treść się zmieniła
    if (file.history[file.history.length - 1] !== editor.value) {
        file.history.push(editor.value);
        if (file.history.length > maxHistory) file.history.shift();
        file.redo = []; // Czyścimy redo przy nowym wpisie
    }
}

function undo() {
    const file = projectFiles[currentFileIndex];
    if (file && file.history.length > 1) {
        const lastState = file.history.pop();
        file.redo.push(lastState);
        
        const previousState = file.history[file.history.length - 1];
        editor.value = previousState;
        file.content = previousState; // Aktualizacja treści w obiekcie
        updateText(editor.value);
        updateLines();
    }
}

function redo() {
    const file = projectFiles[currentFileIndex];
    if (file && file.redo.length > 0) {
        const stateToRestore = file.redo.pop();
        file.history.push(stateToRestore);
        
        editor.value = stateToRestore;
        file.content = stateToRestore;
        updateText(editor.value);
        updateLines();
    }
}
function startContinuousAction(actionFunc) { stopContinuousAction(); actionTimeout = setTimeout(() => { actionInterval = setInterval(() => { actionFunc(); }, 60);}, 400);}
function stopContinuousAction() { clearTimeout(actionTimeout); clearInterval(actionInterval); actionTimeout = null; actionInterval = null;}

    function trash() { document.getElementById('confirm-modal').style.display = 'flex'; }
    function hideTrash() { document.getElementById('confirm-modal').style.display = 'none'; }
    function confirmTrash() {
    const wave = document.getElementById('delete-wave');
    hideTrash();
    wave.classList.remove('animate-delete');
    void wave.offsetWidth;
    wave.classList.add('animate-delete');

    setTimeout(() => {
        editor.value = '';
        const file = projectFiles.find(f => f.type === currentTab);
        if(file) file.content = '';
        
        updateText('');
        updateLines();
        saveState();
        if (typeof updateMarker === 'function') updateMarker();
    }, 150); 
}
    
    function exportAndShare() {
    const html = projectFiles.find(f => f.type === 'html')?.content || '';
    const css = projectFiles.find(f => f.type === 'css')?.content || '';
    const js = projectFiles.find(f => f.type === 'js')?.content || '';

    const finalHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}<\/script>
</body>
</html>`;
    const win = window.open();
    win.document.write(finalHtml);
    win.document.close();
}

function formatCode() {
    let text = editor.value;
    if (!text || !text.trim()) return;

    let sparkle = document.getElementById('format-sparkle');
    if (!sparkle) {
        sparkle = document.createElement('div');
        sparkle.id = 'format-sparkle';
        sparkle.className = 'format-sparkle-overlay';
        document.body.appendChild(sparkle);
    }

    sparkle.classList.remove('animate-sparkle');
    void sparkle.offsetWidth; 
    sparkle.classList.add('animate-sparkle');

    setTimeout(() => {
        const formatCSS = (cssText) => {
            const urls = [];
            let safeText = cssText.replace(/url\((.*?)\)/gi, (match, urlContent) => {
                urls.push(urlContent);
                return `___URL_PLACEHOLDER_${urls.length - 1}___`;
            });

            return safeText
                .replace(/\r?\n/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/\s*\{\s*/g, ' { ')
                .replace(/(?<=[\w\)])\s*:\s*/g, ': ')
                .replace(/:\s+:/g, '::') 
                .replace(/;\s*/g, '; ')
                .replace(/\s*\}\s*/g, ' }\n')
                .replace(/___URL_PLACEHOLDER_(\d+)___/g, (match, index) => `url(${urls[index]})`)
                .replace(/;\s+}/g, '; }')
                .trim();
        };
        
        const formatJS = (js) => {
    return js.replace(/\s*\{\s*/g, ' { ')
             .replace(/\s*\}\s*/g, ' }\n')
             .replace(/;\s*/g, ';\n')
             .replace(/,\s*/g, ', ')
             .replace(/\n\s*\n/g, '\n').trim();
};

        if (currentTab === 'css') {
            text = formatCSS(text);}

            else if (currentTab === 'html') {
            const scripts = [];
            // 1. Zabezpieczamy skrypty
            text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, (match) => {
                scripts.push(match);
                return `___SCRIPT_PLACEHOLDER_${scripts.length - 1}___`;
            });

            // 2. Inteligentne formatowanie struktury
            let indentLevel = 0;
            const tabSize = "    "; // 4 spacje
            
            text = text
                .replace(/\s+/g, ' ')
                .replace(/>\s*</g, '>\n<')
                .split('\n')
                .map(line => {
    let lineTrimmed = line.trim();
    if (!lineTrimmed) return null; // Zwróć null dla pustych linii

    if (lineTrimmed.match(/^<\//)) {
        indentLevel = Math.max(0, indentLevel - 1);
    }

    const formattedLine = tabSize.repeat(indentLevel) + lineTrimmed;

    if (lineTrimmed.match(/^<[^/!][^>]*[^/]>$/) && !lineTrimmed.match(/<(link|meta|br|img|hr|input)/i)) {
        indentLevel++;
    }

    return formattedLine.trimEnd();
})
.filter(l => l !== "")
.join('\n')
                // 3. Formatujemy style wewnątrz
                .replace(/(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/gi, (m, open, css, close) => {
                    return `${open}\n${formatCSS(css)}\n${close}`;
                });

            // 4. Przywracamy skrypty
            scripts.forEach((fullScriptTag, i) => {
                text = text.replace(`___SCRIPT_PLACEHOLDER_${i}___`, fullScriptTag);
            });
        }

        editor.value = text.trim();
        updateText(editor.value);
        updateLines();
        saveState();
        
        if (typeof updateMarker === 'function') updateMarker();
    }, 300);

    setTimeout(() => editor.focus(), 600);
}

function searchCode() {
    const locate = document.getElementById('locate');
    const overlay = document.querySelector('.overlay');
    const input = document.getElementById('locate-input');
    const resultsContainer = document.getElementById('search-results-list');

    if (locate.style.display !== 'flex') {
        locate.style.display = 'flex';
        overlay.style.display = 'block';
        input.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        input.focus();
    } else {
        locate.style.display = 'none';
        overlay.style.display = 'none';
    }
}

document.getElementById('locate-input').addEventListener('input', function() {
    const val = this.value.toLowerCase();
    let resultsContainer = document.getElementById('search-results-list');
    
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results-list';
        resultsContainer.style.cssText = "width:100%; overflow-y:auto; max-height:200px; margin-top:10px;";
        document.getElementById('locate').appendChild(resultsContainer);
    }
    
    resultsContainer.innerHTML = ''; 

    if (val.length >= 3) {
        const lines = editor.value.split('\n');
        
        lines.forEach((lineText, index) => {
            if (lineText.toLowerCase().includes(val)) {
                const div = document.createElement('div');
                div.className = 'search-line-item';
                div.innerHTML = `<span class="search-line-number">${index + 1}</span> <span>${lineText.substring(0, 40).replace(/</g, "&lt;")}...</span>`;
                div.onmousedown = (e) => {
                    e.preventDefault();
                    
                    const lineHeight = 21;
                    const targetScroll = index * lineHeight;

                    editor.scrollTop = targetScroll;
                    
                    highlighter.scrollTop = targetScroll;
                    lineNums.scrollTop = targetScroll;
                    searchCode();
                    editor.focus();
                    
                    const startPos = lines.slice(0, index).join('\n').length + (index > 0 ? 1 : 0);
                    editor.setSelectionRange(startPos, startPos);
                };
                
                resultsContainer.appendChild(div);
            }
        });
    }
});

const moreBtn = document.querySelector('.more-btn');
const menu = document.querySelector('.menu');
moreBtn.onclick = () => {
    menu.classList.toggle('show');
};

function bars() {
    const explorer = document.getElementById('file-explorer');
    const isShowing = explorer.classList.toggle('show');
    if(isShowing) {
        document.querySelector('.menu').classList.remove('show');
    }
}

async function paste() {
            try {
                const tekst = await navigator.clipboard.readText();
                document.getElementById('editor').value = tekst;
            } catch (blad) {
                console.error('Clipboard access denied or error:', blad);
                alert("Couldn't paste text. Make sure you've given permission to access your clipboard.");
            }
            editor.value = text.trim();
        updateText(editor.value);
        updateLines();
        saveState();
        }

    function renderFileList() {
    const container = document.getElementById('file-list-container');
    container.innerHTML = '';
    projectFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        // Pobieramy ikonę na podstawie nazwy pliku
        const iconClass = getFileIcon(file.name);
        
        item.innerHTML = `
            <span><i class="${iconClass}" style="margin-right: 8px; color: var(--accent);"></i> ${file.name}</span>
            <i class="fa-solid fa-trash-can" style="color:#ed4a4a;" onclick="deleteFile(event, ${index})"></i>
        `;
        item.onclick = () => loadFile(index);
        container.appendChild(item);
    });
}

    function loadFile(index) {
        const file = projectFiles[index];
        switchTab(file.type);
        editor.value = file.content;
        updateText(editor.value);
        document.getElementById('file-explorer').classList.remove('show');
    }

    function deleteFile(event, index) {
        event.stopPropagation();
        if(projectFiles.length > 1) {
            projectFiles.splice(index, 1);
            renderFileList();
        }
    }

    function openCreateMenu() { document.getElementById('create-file-modal').style.display = 'flex'; }
    function closeCreateMenu() { document.getElementById('create-file-modal').style.display = 'none'; }

    function confirmCreateItem() {
    const name = document.getElementById('new-file-name').value;
    const type = document.getElementById('new-item-type').value;
    if (name) {
        projectFiles.push({ 
            name: name, 
            type: type, 
            content: '',
            history: [''], // Tu będą zmiany
            redo: [] 
        });
        renderFileList();
        closeCreateMenu();
        document.getElementById('new-file-name').value = '';
    }
}

function loadFile(index) {
    currentFileIndex = index; // Kluczowy krok
    const file = projectFiles[index];
    
    // SwitchTab zajmie się UI, ale my nadpisujemy treść z obiektu pliku
    switchTab(file.type); 
    editor.value = file.content;
    updateText(editor.value);
    updateLines();
    document.getElementById('file-explorer').classList.remove('show');
}
    
    function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        'py': 'fa-brands fa-python',
        'cpp': 'fa-solid fa-c',
        'c': 'fa-solid fa-c',
        'cs': 'fa-solid fa-hashtag',
        'java': 'fa-brands fa-java',
        'json': 'fa-brands fa-node-js',
        'js': 'fa-brands fa-js',
        'ts': 'fa-brands fa-typescript',
        'go': 'fa-solid fa-g',
        'sql': 'fa-solid fa-database',
        'php': 'fa-brands fa-php',
        'rs': 'fa-solid fa-gear',
        'r': 'fa-solid fa-chart-line',
        'rb': 'fa-solid fa-gem',
        'swift': 'fa-brands fa-swift',
        'kt': 'fa-solid fa-k',
        'html': 'fa-brands fa-html5',
        'css': 'fa-brands fa-css3-alt',
        'bin': 'fa-solid fa-square-binary',
        'dat': 'fa-solid fa-database',
        'lua': 'fa-regular fa-circle-dot',
        'bas': 'fa-brands fa-bimobject', 'vb': 'fa-solid fa-v', 'vbs': 'fa-solid fa-v', 'vba': 'fa-solid fa-v',
        'swift': 'fa-brands fa-swift',
        'pascal': 'fa-brands fa-pandora',
        'rkt': 'fa-solid fa-y',
        'tcl': 'fa-solid fa-feather', 'expect': 'fa-solid fa-feather',
        'cr': 'fa-solid fa-hexagon',
        'nim': 'fa-brands fa-square-web-awesome', 'nims': 'fa-brands fa-square-web-awesome',
        'pl': 'fa-solid fa-horse-head',
        'hx': 'fa-solid fa-xmark',
        'ex': 'fa-solid fa-ring',
        'f': 'fa-solid fa-florin-sign',
        'rex': 'fa-brands fa-ravelry', 'rexx': 'fa-brands fa-ravelry'
    };
    return icons[ext] || 'fa-solid fa-circle';
}

window.addEventListener('click', (e) => {if (!moreBtn.contains(e.target) && !menu.contains(e.target)) {menu.classList.remove('show');}});
document.querySelectorAll('.toolbar i').forEach(icon => {icon.addEventListener('click', () => {icon.classList.remove('tab-icon-click');void icon.offsetWidth;icon.classList.add('tab-icon-click');});});
document.querySelector('.tabs').addEventListener('mousedown', (e) => { const tab = e.target.closest('.tab'); if (!tab) return; const rect = tab.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; tab.style.setProperty('--mouse-x', x + "px"); tab.style.setProperty('--mouse-y', y + "px");});
document.querySelector('.tabs').addEventListener('touchstart', (e) => { const tab = e.target.closest('.tab'); if (!tab) return; const rect = tab.getBoundingClientRect(); const touch = e.touches[0]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; tab.style.setProperty('--mouse-x', x + "px"); tab.style.setProperty('--mouse-y', y + "px");},{ passive: true });