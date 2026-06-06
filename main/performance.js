/**
 * Enterprise Performance Booster v4.0 - Ultra Extreme Edition
 * Optimized for maximum mobile performance and instant editing up to 10,000+ lines.
 */
(() => {
  'use strict';
  
    const executeEngine = () => {
    const tasks = [
      { name: 'Scripts', fn: optimizeScripts },
      { name: 'LoadBalancer', fn: initMultiCoreLoadBalancer },
      { name: 'Comments', fn: cleanComments },
      { name: 'Listeners', fn: optimizeEventListeners },
      { name: 'LazyLoad', fn: nativeLazyLoad },
      { name: 'Prefetching', fn: initPrefetching },
      { name: 'VirtualScroll', fn: initHighPerfVirtualScroll },
      { name: 'MemoryDriver', fn: initHighPerfMemoryDriver },
      { name: 'CpuProtection', fn: initCpuThrottlingProtection },
      { name: 'Saver', fn: initDataAndBatterySaver },
      { name: 'Viewport', fn: initViewportIsolation },
      { name: 'GpuAccel', fn: initGpuAcceleration }
    ];

    tasks.forEach(task => {
      try {
        task.fn();
      } catch (err) {
        console.warn(`[Booster] Not working, still waiting ${task.name}:`, err);
      }
    });
    console.log('%c[Booster v4.0]');
  };
  
  // 1. Optymalizacja skryptów i zasobów (Bezblokowa pętla)
  const optimizeScripts = () => {
    const scripts = document.querySelectorAll('script[src]:not([defer]):not([async])');
    const host = window.location.hostname;
    for (let i = 0; i < scripts.length; i++) {
      if (!scripts[i].src.includes(host)) {
        scripts[i].setAttribute('defer', 'true');
      }
    }
  };

  // 2. Bezpieczne usuwanie komentarzy z optymalizacją pamięci
  const cleanComments = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
    const nodesToRemove = [];
    while (walker.nextNode()) nodesToRemove.push(walker.currentNode);
    for (let i = 0; i < nodesToRemove.length; i++) {
      nodesToRemove[i].remove();
    }
  };

  // 3. Wymuszenie pasywnych zdarzeń (Zero blokowania wątku UI)
  const optimizeEventListeners = () => {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const passiveEvents = new Set(['scroll', 'touchstart', 'touchmove', 'mousewheel', 'wheel']);
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (passiveEvents.has(type)) {
        if (typeof options === 'boolean') {
          options = { capture: options, passive: true };
        } else if (typeof options === 'object') {
          options.passive = true;
        } else {
          options = { passive: true };
        }
      }
      originalAddEventListener.call(this, type, listener, options);
    };
  };

  // 4. Natywny Lazy Load
  const nativeLazyLoad = () => {
    const elements = document.querySelectorAll('img:not([loading]), iframe:not([loading])');
    for (let i = 0; i < elements.length; i++) {
      elements[i].setAttribute('loading', 'lazy');
    }
  };

  const initHighPerfMemoryDriver = () => {
  window.__X_PERF_DRIVER__ = {
    pool: new Map(),
    set: function(key, value) {
      if (this.pool.size > 200) this.pool.clear();
      this.pool.set(key, value);
    },
    get: function(key) {
      return this.pool.get(key);
    }
  };
  console.log('%c[Driver] New RAM driver has been loaded.');
};

const initCpuThrottlingProtection = () => {
  let lastFrameTime = performance.now();
  window.checkCpuLoad = () => {
    const currentFrameTime = performance.now();
    const delta = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;
    return delta > 18; 
  };
};

const initDataAndBatterySaver = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isDataSaverActive = connection && (connection.saveData || ['cellular', '2g', '3g'].includes(connection.type));
  if (isDataSaverActive) {
    window.__DISABLE_PREFETCH__ = true;
    console.log('%c[Saver]');
  }
};

const initMultiCoreLoadBalancer = () => {
  const coreCount = navigator.hardwareConcurrency || 4;
  window.__CPU_POOL__ = {
    workers: [],
    tasksInProgress: new Uint32Array(coreCount),
    nextTaskId: 0,
    callbacks: new Map()
  };
  const workerCode = `
    self.onmessage = function(e) {
      const { taskId, text, action } = e.data;
      if (action === 'parse') {
        const lines = (text.match(/\\n/g) || []).length + 1;
        const words = text.trim().split(/\\s+/).length;
        self.postMessage({ taskId, result: { lines, words } });
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  // 2. Inicjalizacja puli workerów – dokładnie tyle, ile system ma rdzeni
  for (let i = 0; i < coreCount; i++) {
    const worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      const { taskId, result } = e.data;
      window.__CPU_POOL__.tasksInProgress[i]--;
      if (window.__CPU_POOL__.callbacks.has(taskId)) {
        window.__CPU_POOL__.callbacks.get(taskId)(result);
        window.__CPU_POOL__.callbacks.delete(taskId);
      }
    };
    window.__CPU_POOL__.workers.push(worker);
  }

  // 3. Globalny inteligentny dystrybutor zadań (Load Balancer)
  window.__DISPATCH_JOB__ = (text, callback) => {
    const pool = window.__CPU_POOL__;
    let optimalCoreIndex = 0;
    let minTasks = pool.tasksInProgress[0];
    for (let i = 1; i < pool.tasksInProgress.length; i++) {
      if (pool.tasksInProgress[i] < minTasks) {
        minTasks = pool.tasksInProgress[i];
        optimalCoreIndex = i;
      }
    }
    const taskId = pool.nextTaskId++;
    pool.callbacks.set(taskId, callback);
    pool.tasksInProgress[optimalCoreIndex]++;
    pool.workers[optimalCoreIndex].postMessage({
      taskId: taskId,
      action: 'parse',
      text: text
    });
  };
  console.log('%c[LoadBalancer] Still working');
};

const initViewportIsolation = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.__SUSPEND_RENDER__ = true;
    } else {
      window.__SUSPEND_RENDER__ = false;
      const activeTextarea = document.querySelector('textarea');
      if (activeTextarea) activeTextarea.dispatchEvent(new Event('scroll'));
    }
  });
};

  // 5. Pre-fetching linków w mikro-zadaniach
  const initPrefetching = () => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries, obs) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = entries[i].target.href;
          document.head.appendChild(link);
          obs.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: "120px" });
    const origin = window.location.origin;
    const links = document.querySelectorAll('a[href^="/"], a[href^="' + origin + '"]');
    for (let i = 0; i < links.length; i++) {
      observer.observe(links[i]);
    }
  };

    // 6. SILNIK ULTRA-WIRTUALIZACJI TEKSTU Z BALANSEREM RDZENI CPU
  const initHighPerfVirtualScroll = (selector = 'pre, code') => {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      const isEditable = container.hasAttribute('contenteditable') || container.closest('[contenteditable="true"]');
      if (!isEditable) return;
      let rawText = container.textContent;
      let lineCount = (rawText.match(/\n/g) || []).length + 1;
      if (lineCount < 100) return;
      const computedStyle = window.getComputedStyle(container);
      let lineHeight = parseFloat(computedStyle.lineHeight);
      if (isNaN(lineHeight)) {
        lineHeight = parseFloat(computedStyle.fontSize) * 1.2 || 20;
      }
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      container.innerHTML = '';

      const shadowTextArea = document.createElement('textarea');
      shadowTextArea.value = rawText;
      shadowTextArea.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2; overflow-y: auto; overflow-x: auto; webkit-overflow-scrolling: touch;
        font: ${computedStyle.font}; line-height: ${lineHeight}px; padding: ${computedStyle.padding};
        border: none; outline: none; background: transparent; color: transparent;
        caret-color: ${computedStyle.color || '#000'}; resize: none; white-space: pre;
      `;
      const visualContainer = document.createElement('div');
      visualContainer.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 1; pointer-events: none; padding: ${computedStyle.padding}; box-sizing: border-box;
      `;
      const ScroogeSpacer = document.createElement('div');
      ScroogeSpacer.style.cssText = `position: absolute; width: 1px; height: ${lineCount * lineHeight}px;`;
      const textWrapper = document.createElement('div');
      textWrapper.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0;
        font: ${computedStyle.font}; line-height: ${lineHeight}px; white-space: pre;
        will-change: transform; transform: translate3d(0,0,0);
      `;
      visualContainer.appendChild(ScroogeSpacer);
      visualContainer.appendChild(textWrapper);
      container.appendChild(visualContainer);
      container.appendChild(shadowTextArea);
      
      const containerHeight = container.clientHeight || 500;
      const visibleLinesCount = Math.ceil(containerHeight / lineHeight) + 10;
      
      let cachedLines = null;
      const getLines = () => {
        if (!cachedLines) cachedLines = shadowTextArea.value.split('\n');
        return cachedLines;
      };
      const renderVisibleLines = () => {
        const scrollTop = shadowTextArea.scrollTop;
        let startIndex = Math.floor(scrollTop / lineHeight) - 3;
        if (startIndex < 0) startIndex = 0;
        let endIndex = startIndex + visibleLinesCount;
        const allLines = getLines();
        if (endIndex > allLines.length) endIndex = allLines.length;
        textWrapper.style.transform = `translate3d(0, ${startIndex * lineHeight}px, 0)`;
        textWrapper.textContent = allLines.slice(startIndex, endIndex).join('\n');
      };
      shadowTextArea.addEventListener('input', () => {
        cachedLines = null;
        const currentLineCount = (shadowTextArea.value.match(/\n/g) || []).length + 1;
        ScroogeSpacer.style.height = `${currentLineCount * lineHeight}px`;
        if (typeof window.__DISPATCH_JOB__ === 'function') {
          window.__DISPATCH_JOB__(shadowTextArea.value, (result) => {
          });
        }
      queueMicrotask(renderVisibleLines);
      }, { passive: true });
      let ticking = false;
      shadowTextArea.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            renderVisibleLines();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
      renderVisibleLines();
    });
  };
  
  // 7. GPU COMPOSITOR ACCELERATION - Monster Performance Edition
  const initGpuAcceleration = async () => {
    const style = document.createElement('style');
    style.textContent = `
      .gpu-accelerated {
        transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1) translateZ(0);
        will-change: transform, scroll-position;
        contain: strict;
        isolation: isolate;
        backface-visibility: hidden;
        /*perspective: 1000px;
        transform-style: preserve-3d;*/
        -webkit-font-smoothing: none;
        -moz-osx-font-smoothing: unset;
        text-rendering: optimizeSpeed;
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
    const triggerHighPerformanceHardware = async () => {
      try {
        if (navigator.gpu) {
          const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
          if (adapter) {
            console.log('[GPU Engine] HPerf Adapter locked (Vulkan/Metal Native Path).');
            return;
          }
        }
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', { 
          powerPreference: 'high-performance', 
          failIfMajorPerformanceCaveat: true,
          antialias: false,
          depth: false
        });
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
          console.log(`[GPU Engine] WebGL2 HPerf ${renderer}`);
        }
      } catch (e) {
        console.warn('[GPU Engine] blocked l-end allocation hints:', e);
      }
    };
    const applyGpu = (target) => {
      if (target.tagName === 'TEXTAREA') return; 
      if (!target.classList.contains('gpu-accelerated')) {
        target.classList.add('gpu-accelerated');
      }
    };
    const targets = document.querySelectorAll('pre, code');
    targets.forEach(applyGpu);
    const observer = new MutationObserver((mutations) => {
      const len = mutations.length;
      for (let i = 0; i < len; i++) {
        const added = mutations[i].addedNodes;
        const addedLen = added.length;
        for (let j = 0; j < addedLen; j++) {
          const node = added[j];
          if (node.nodeType === 1 && node.matches('pre, code')) {
            applyGpu(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    triggerHighPerformanceHardware();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executeEngine);
  } else {
    executeEngine();
  }
})();


(function() {
    const customHexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\.([0-9]{1,2})([0-9]{0,4})/g;
    function toRgba(match, hex, integerPart, decimalPart) {
        let fullHex = hex;
        if (hex.length === 3) {
            fullHex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const r = parseInt(fullHex.substring(0, 2), 16);
        const g = parseInt(fullHex.substring(2, 4), 16);
        const b = parseInt(fullHex.substring(4, 6), 16);
        let percentageStr = integerPart;
        if (decimalPart) percentageStr += '.' + decimalPart;
        const alpha = parseFloat(percentageStr) / 100;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    function processNode(node) {
        if (node.nodeType !== 1) return;
        const tagName = node.tagName.toLowerCase();
        if (node.hasAttribute('style')) {
            let style = node.getAttribute('style');
            if (customHexRegex.test(style)) {
                customHexRegex.lastIndex = 0;
                node.setAttribute('style', style.replace(customHexRegex, toRgba));
            }
        }
        if (tagName === 'script') {
            if (customHexRegex.test(node.textContent)) {
                customHexRegex.lastIndex = 0;
                node.textContent = node.textContent.replace(customHexRegex, toRgba);
            }
        }
    }
    document.querySelectorAll('[style], script').forEach(processNode);
    function processStylesheets() {
        for (let sheet of document.styleSheets) {
            try {
                let rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;
                for (let i = 0; i < rules.length; i++) {
                    if (rules[i].style && customHexRegex.test(rules[i].style.cssText)) {
                        customHexRegex.lastIndex = 0;
                        rules[i].style.cssText = rules[i].style.cssText.replace(customHexRegex, toRgba);
                    }
                }
            } catch (e) {
            }
        }
    }
    processStylesheets();
    const observer = new MutationObserver((mutations) => {
        let stylesChanged = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.tagName.toLowerCase() === 'style') {
                        stylesChanged = true;
                    }
                    processNode(node);
                    node.querySelectorAll('[style], script').forEach(processNode);
                }
            });
        });
        if (stylesChanged) processStylesheets();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
