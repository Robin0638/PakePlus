document.addEventListener('DOMContentLoaded', function() {
    if (window.WaterReminderManager) {
        WaterReminderManager.init();
    }
});

/**
 * Universal file download method, compatible with HBuilderX packaging and browsers
 * @param {string} url Download link
 * @param {string} filename Save filename (optional)
 */
function downloadFile(url, filename) {
        if (window.plus) {
            // Request storage permission
            plus.android.requestPermissions(
                ["android.permission.WRITE_EXTERNAL_STORAGE"],
                function(e) {
                    // Permission request successful
                    let dtask = plus.downloader.createDownload(url, {
                        filename: "_downloads/" + (filename || url.split('/').pop())
                    }, function(d, status) {
                        if (status == 200) {
                            plus.nativeUI.toast("Download successful: " + d.filename);
                            // Automatically open file after download completes
                            plus.runtime.openFile(d.filename);
                        } else {
                            plus.nativeUI.toast("Download failed");
                        }
                    });
                    dtask.start();
                },
                function(e) {
                    plus.nativeUI.toast("Storage permission denied, unable to download");
                }
            );
        } else {
            // Browser environment, fallback handling
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const a = document.createElement('a');
                    a.href = window.URL.createObjectURL(blob);
                    a.download = filename || url.split('/').pop();
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(a.href);
                })
                .catch(() => {
                    window.open(url, '_blank');
                });
        }
    }

// Get elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const bottomNav = document.querySelector('.bottom-nav');

// Hide bottom bar when opening settings modal
settingsBtn.addEventListener('click', function() {
    if (bottomNav) bottomNav.style.display = 'none';
});

// Show bottom bar when closing settings modal
settingsClose.addEventListener('click', function() {
    if (bottomNav) bottomNav.style.display = '';
});
