/**
 * Boostie Engine v4.5 - Ultra Extreme Edition
 * Optimized for maximum mobile performance and instant editing up to 10,000+ lines.
 */
(() => {
  'use strict';
  
  const Scheduler = (() => {
  const queue = [];
  let running = false;
  const run = (deadline) => {
    running = true;
    while ((deadline?.timeRemaining?.() > 0 || !deadline) && queue.length) {
      const task = queue.shift();
      try { task(); } catch (e) {}
    }
    if (queue.length) {
      requestIdleCallback(run, { timeout: 200 });
    } else {
      running = false;
    }
  };
  return {
    add(task) {
      queue.push(task);
      if (!running) {
        requestIdleCallback(run, { timeout: 200 });
      }
    }
  };
})();

const FeatureFlags = {
  gpu: true,
  workers: true,
  prefetch: true,
  virtualScroll: true,
  listenersPatch: false,
  commentsCleaner: false
};

  const SafeEvents = {
  passive: false
};
const addSafeListener = (el, type, fn, options = {}) => {
  if (
    SafeEvents.passive &&
    ['scroll', 'touchmove', 'wheel'].includes(type)
  ) {
    options.passive = true;
  }
  el.addEventListener(type, fn, options);
};
    const executeEngine = () => {
    const tasks = [
      { name: 'Scripts', fn: optimizeScripts },
      { name: 'WorkerPool', fn: initWorkerPool },
      { name: 'Comments', fn: cleanComments },
      FeatureFlags.listenersPatch ? { name: 'Listeners', fn: optimizeEventListeners } : null,
      { name: 'LazyLoad', fn: nativeLazyLoad },
      { name: 'Prefetching', fn: initPrefetching },
      { name: 'VirtualScroll', fn: initHighPerfVirtualScroll },
      { name: 'MemoryDriver', fn: initHighPerfMemoryDriver },
      { name: 'CpuProtection', fn: initCpuThrottlingProtection },
      { name: 'Saver', fn: initDataAndBatterySaver },
      { name: 'Viewport', fn: initViewportIsolation },
      { name: 'GpuAccel', fn: initGpuAcceleration }
   ].filter(Boolean);

    tasks.forEach(task => {
      try {
        task.fn();
      } catch (err) {
        console.warn(`[Booster] Not working, still waiting ${task.name}:`, err);
      }
    });
    console.log('%c[Booster v4.0]');
  };
  
  const optimizeScripts = () => {
  const scripts = document.querySelectorAll('script[src]:not([data-optimized])');
  const host = location.hostname;
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    try {
      script.setAttribute('data-optimized', 'true');
      const isExternal = script.src && !script.src.includes(host);
      const alreadyOptimized = script.hasAttribute('defer') || script.hasAttribute('async');
      if (isExternal && !alreadyOptimized) {
        script.defer = true;
      }
    } catch (e) {
      console.warn('[Booster][Scripts] Failed to optimize script:', script, e);
    }
  }
};

  // 2. Bezpieczne usuwanie komentarzy z optymalizacją pamięci
  const cleanComments = () => {
  if (!document.body) return;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );
  let node;
  const fragment = document.createDocumentFragment();
  while ((node = walker.nextNode())) {
    fragment.appendChild(node);
  }
  fragment.childNodes.forEach(n => n.remove());
};

  // 3. Wymuszenie pasywnych zdarzeń (Zero blokowania wątku UI)
  const optimizeEventListeners = () => {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  if (originalAddEventListener.__patched__) return;
  const passiveEvents = new Set([
    'scroll',
    'touchstart',
    'touchmove',
    'mousewheel',
    'wheel'
  ]);
  const patched = function (type, listener, options) {
    if (passiveEvents.has(type)) {
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else if (options && typeof options === 'object') {
        options = { ...options, passive: true };
      } else {
        options = { passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  patched.__patched__ = true;
  EventTarget.prototype.addEventListener = patched;
};

  // 4. Natywny Lazy Load
  const nativeLazyLoad = () => {
  const elements = document.querySelectorAll(
    'img:not([loading]), iframe:not([loading])'
  );
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.tagName === 'IMG') {
      el.loading = 'lazy';
      el.decoding = 'async';
    } else if (el.tagName === 'IFRAME') {
      el.setAttribute('loading', 'lazy');
      el.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    }
  }
};

  const initHighPerfMemoryDriver = () => {
  if (window.__X_PERF_DRIVER__) return;
  const pool = new Map();
  window.__X_PERF_DRIVER__ = {
    pool,
    maxSize: 200,
    set(key, value) {
      if (pool.size >= this.maxSize) {
        pool.clear();
      }
      pool.set(key, value);
    },
    get(key) {
      return pool.get(key);
    },
    has(key) {
      return pool.has(key);
    },
    delete(key) {
      return pool.delete(key);
    },
    clear() {
      pool.clear();
    }
  };
  console.log('%c[Driver] New RAM driver has been loaded.');
};

const initCpuThrottlingProtection = () => {
  if (window.checkCpuLoad) return;
  let lastFrameTime = performance.now();
  window.checkCpuLoad = () => {
    const currentFrameTime = performance.now();
    const delta = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;
    return delta > 16.7;
  };
};

const initDataAndBatterySaver = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const isSlowConnection =
    connection &&
    (
      connection.saveData === true ||
      ['slow-2g', '2g', '3g'].includes(connection.effectiveType || connection.type)
    );
  const isLowBattery =
    typeof navigator.getBattery === 'function'
      ? navigator.getBattery().then(battery => battery?.level < 0.2)
      : false;
  const applySaver = (lowBattery) => {
    if (isSlowConnection || lowBattery) {
      window.__DISABLE_PREFETCH__ = true;
      window.__REDUCE_ANIMATION__ = true;
      window.__SAVE_MODE__ = true;
      console.log('%c[Saver]');
    }
  };
  if (typeof isLowBattery === 'object') {
    isLowBattery.then(applySaver);
  } else {
    applySaver(false);
  }
};

const WorkerPool = (() => {
  const workers = [];
  const queue = [];
  const busy = new Set();
  const coreCount = navigator.hardwareConcurrency || 4;

  const taskMap = new Map();

  const workerCode = `
    self.onmessage = function(e) {
      const { id, text } = e.data;
      const lines = (text.match(/\\n/g) || []).length + 1;
      const words = text.trim().split(/\\s+/).filter(Boolean).length;
      postMessage({ id, result: { lines, words } });
    };
  `;

  const blob = new Blob([workerCode]);
  const url = URL.createObjectURL(blob);

  for (let i = 0; i < coreCount; i++) {
    const w = new Worker(url);

    w.onmessage = (e) => {
      const { id, result } = e.data;
      const cb = taskMap.get(id);

      if (cb) cb(result);
      taskMap.delete(id);
      busy.delete(w);

      process();
    };

    workers.push(w);
  }

  const process = () => {
    if (!queue.length) return;

    const free = workers.find(w => !busy.has(w));
    if (!free) return;

    const job = queue.shift();
    busy.add(free);

    taskMap.set(job.id, job.cb);
    free.postMessage(job);
  };

  return {
    run(text, cb) {
      queue.push({
        id: crypto.randomUUID(),
        text,
        cb
      });
      process();
    }
  };
})();

const initWorkerPool = () => {
  if (window.__WORKER_POOL__) return;
  window.__WORKER_POOL__ = WorkerPool;
  console.log('%c[WorkerPool] initialized');
};

const initViewportIsolation = () => {
  if (window.__VIEWPORT_ISOLATION__) return;
  window.__VIEWPORT_ISOLATION__ = true;
  const onChange = () => {
    const hidden = document.hidden;
    window.__SUSPEND_RENDER__ = hidden;
    if (!hidden) {
      const activeTextarea = document.activeElement?.tagName === 'TEXTAREA'
        ? document.activeElement
        : document.querySelector('textarea');
      if (activeTextarea) {
        activeTextarea.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    }
  };
  document.addEventListener('visibilitychange', onChange, { passive: true });
  onChange();
};

  // 5. Pre-fetching linków w mikro-zadaniach
  const initPrefetching = () => {
  if (window.__DISABLE_PREFETCH__) return;
  if (!('IntersectionObserver' in window)) return;
  const observed = new WeakSet();
  const observer = new IntersectionObserver((entries, obs) => {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (observed.has(el)) continue;
      observed.add(el);
      const href = el?.href;
      if (!href) continue;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      obs.unobserve(el);
    }
  }, {
    rootMargin: '150px',
    threshold: 0.1
  });
  const origin = location.origin;
  const links = document.querySelectorAll(
    `a[href^="/"], a[href^="${origin}"]`
  );
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link.href) observer.observe(link);
  }
};

    // 6. SILNIK ULTRA-WIRTUALIZACJI TEKSTU Z BALANSEREM RDZENI CPU
  const initHighPerfVirtualScroll = (selector = 'pre, code') => {
  const containers = document.querySelectorAll(selector);
  containers.forEach(container => {
    const isEditable =
      container.hasAttribute('contenteditable') ||
      container.closest('[contenteditable="true"]');
    if (!isEditable) return;
    const rawText = container.textContent || '';
    const lineCount = (rawText.match(/\n/g) || []).length + 1;
    if (lineCount < 100) return;
    const computedStyle = window.getComputedStyle(container);
    let lineHeight = parseFloat(computedStyle.lineHeight);
    if (Number.isNaN(lineHeight)) {
      lineHeight = (parseFloat(computedStyle.fontSize) || 16) * 1.2;
    }
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.innerHTML = '';
    const shadowTextArea = document.createElement('textarea');
    shadowTextArea.value = rawText;
    Object.assign(shadowTextArea.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '2',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
      font: computedStyle.font,
      lineHeight: `${lineHeight}px`,
      padding: computedStyle.padding,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'transparent',
      caretColor: computedStyle.color || '#000',
      resize: 'none',
      whiteSpace: 'pre'
    });
    const visualContainer = document.createElement('div');
    Object.assign(visualContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '1',
      pointerEvents: 'none',
      padding: computedStyle.padding,
      boxSizing: 'border-box'
    });
    const spacer = document.createElement('div');
    spacer.style.height = `${lineCount * lineHeight}px`;
    const textWrapper = document.createElement('div');
    const linePool = [];
    Object.assign(textWrapper.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      font: computedStyle.font,
      lineHeight: `${lineHeight}px`,
      whiteSpace: 'pre',
      willChange: 'transform',
      transform: 'translate3d(0,0,0)'
    });
    visualContainer.appendChild(spacer);
    visualContainer.appendChild(textWrapper);
    container.appendChild(visualContainer);
    container.appendChild(shadowTextArea);
    const containerHeight = container.clientHeight || 500;
    let overscan = 12;
const getVisibleLinesCount = () => {
    if (window.checkCpuLoad?.()) {
        overscan = 6;
    } else {
        overscan = 18;
    }
    return Math.ceil(container.clientHeight / lineHeight) + overscan;
};
    let cachedLines = null;
let lastStart = -1;
let lastEnd = -1;
    let lineCache = [];
const getLines = () => {
  if (!cachedLines) {
    cachedLines = shadowTextArea.value.split('\n');
    lineCache = cachedLines;
  }
  return cachedLines;
};
const rebuildCache = () => {
    Scheduler.add(() => {
        cachedLines = shadowTextArea.value.split('\n');
        lineCache = cachedLines;
    });
};
    const renderVisibleLines = () => {
  const scrollTop = shadowTextArea.scrollTop;
  const startIndex =
      Math.max(0, Math.floor(scrollTop / lineHeight) - 4);
const endIndex =
    Math.min(startIndex + getVisibleLinesCount(), getLines().length);
  if (
      startIndex === lastStart &&
      endIndex === lastEnd
  ) {
      return;
  }
  lastStart = startIndex;
  lastEnd = endIndex;
  textWrapper.style.transform =
      `translate3d(0,${startIndex * lineHeight}px,0)`;
  const visible = endIndex - startIndex;
while (linePool.length < visible) {
    const line = document.createElement('div');
    line.style.whiteSpace = 'pre';
    linePool.push(line);
    textWrapper.appendChild(line);
}
for (let i = 0; i < visible; i++) {
    const node = linePool[i];
    const text = lineCache[startIndex + i];
    if (node.textContent !== text) {
        node.textContent = text;
    }
    node.style.display = '';
}
for (let i = visible; i < linePool.length; i++) {
    linePool[i].style.display = 'none';
}
};
    let rafId = 0;
const scheduleRender = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    renderVisibleLines();
  });
};
let workerTimer = 0;
addSafeListener(shadowTextArea, 'input', () => {
    cachedLines = null;
rebuildCache();
    lastStart = -1;
    lastEnd = -1;
    const currentLineCount =
      (shadowTextArea.value.match(/\n/g) || []).length + 1;
    spacer.style.height = `${currentLineCount * lineHeight}px`;
    clearTimeout(workerTimer);
    workerTimer = setTimeout(() => {
        Scheduler.add(() => {
            window.__WORKER_POOL__?.run(shadowTextArea.value, () => {});
        });
    }, 120);
    scheduleRender();
});
addSafeListener(shadowTextArea, 'scroll', scheduleRender, {
  passive: true
});
renderVisibleLines();
  });
};
  
  // 7. GPU COMPOSITOR ACCELERATION - Monster Performance Edition
  const initGpuAcceleration = async () => {
  if (window.__GPU_INIT__) return;
  window.__GPU_INIT__ = true;
  const style = document.createElement('style');
  style.textContent = `
    .gpu-accelerated {
      transform: translateZ(0);
      will-change: transform;
      contain: strict;
      content-visibility: auto;
      contain-intrinsic-size: 1000px;
      isolation: isolate;
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeSpeed;
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(style);
  const applyGpu = (target) => {
    if (!target || target.tagName === 'TEXTAREA') return;
    if (target.classList.contains('gpu-accelerated')) return;
    target.classList.add('gpu-accelerated');
  };
  const targets = document.querySelectorAll('pre, code');
  for (let i = 0; i < targets.length; i++) {
    applyGpu(targets[i]);
  }
  const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const nodes = mutations[i].addedNodes;
      for (let j = 0; j < nodes.length; j++) {
        const node = nodes[j];
        if (node.nodeType !== 1) continue;
        if (node.matches?.('pre, code')) {
          applyGpu(node);
        }
        const nested = node.querySelectorAll?.('pre, code');
        if (nested?.length) {
          for (let k = 0; k < nested.length; k++) {
            applyGpu(nested[k]);
          }
        }
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  const triggerHighPerformanceHardware = async () => {
    try {
      if (navigator.gpu?.requestAdapter) {
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: 'high-performance'
        });
        if (adapter) {
          console.log('[GPU Engine] HPerf Adapter locked (Native GPU path).');
          return;
        }
      }
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        depth: false
      });
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : 'Unknown';
        console.log(`[GPU Engine] WebGL2 HPerf ${renderer}`);
      }
    } catch (e) {
      console.warn('[GPU Engine] hardware probe failed:', e);
    }
  };
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