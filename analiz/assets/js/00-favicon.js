
(()=>{const raw=getComputedStyle(document.documentElement).getPropertyValue('--rk-logo-image').trim();const logo=raw.replace(/^url\(["']?/,'').replace(/["']?\)$/,'');document.getElementById('rk-favicon')?.setAttribute('href',logo);document.getElementById('rk-apple-touch-icon')?.setAttribute('href',logo);})();
