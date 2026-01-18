/**
 * Tiger 900 - Module Loader
 *
 * This script bootstraps the ES module-based architecture.
 * It dynamically loads main.js as an ES module.
 *
 * MkDocs doesn't natively support ES modules in extra_javascript,
 * so this loader bridges the gap.
 */

(function() {
  'use strict';

  // Only load on modern browsers that support ES modules
  if (!('noModule' in HTMLScriptElement.prototype)) {
    console.warn('[Tiger900] ES modules not supported in this browser');
    return;
  }

  // Get the base path for scripts
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var basePath = currentScript.src.replace(/loader\.js.*$/, '');

  // Create and append the module script
  var moduleScript = document.createElement('script');
  moduleScript.type = 'module';
  moduleScript.src = basePath + 'main.js';

  // Handle loading errors
  moduleScript.onerror = function() {
    console.error('[Tiger900] Failed to load main.js module');
  };

  // Append to document
  document.head.appendChild(moduleScript);
})();
