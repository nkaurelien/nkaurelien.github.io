/**
 * Cache promises of scripts being loaded to avoid duplicate requests/tags.
 */
const scriptCache = new Map();

/**
 * Dynamically loads an external JavaScript file on the client side.
 *
 * @param {string} src - The URL of the script to load.
 * @param {string} [id] - Optional HTML element ID for the script tag.
 * @param {Object} [options] - Additional script options.
 * @param {boolean} [options.async=true] - Whether the script should load asynchronously.
 * @param {boolean} [options.defer=false] - Whether the script should defer execution.
 * @returns {Promise<void>} Resolves when script is successfully loaded.
 */
export function loadScript(src, id, options = {}) {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const scriptId = id || src;

  // 1. If script element already exists in DOM
  if (document.getElementById(scriptId)) {
    return Promise.resolve();
  }

  // 2. If load process is already in progress, reuse existing promise
  if (scriptCache.has(scriptId)) {
    return scriptCache.get(scriptId);
  }

  const { async = true, defer = false } = options;

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.id = scriptId;
    script.async = async;
    script.defer = defer;

    script.onload = () => {
      scriptCache.delete(scriptId);
      resolve();
    };

    script.onerror = err => {
      scriptCache.delete(scriptId);
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        scriptElement.remove();
      }
      reject(err);
    };

    document.head.appendChild(script);
  });

  scriptCache.set(scriptId, promise);
  return promise;
}

export default loadScript;
