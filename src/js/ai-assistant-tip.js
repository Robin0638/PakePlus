document.addEventListener('DOMContentLoaded', function() {
    var copyBtn = document.getElementById('copy-ai-url');
    var urlBox = document.getElementById('ai-url-box');
    if (copyBtn && urlBox) {
        copyBtn.addEventListener('click', function() {
            var text = urlBox.textContent;
            navigator.clipboard.writeText(text).then(function() {
                copyBtn.textContent = 'Copied Successfully!';
                setTimeout(function() {
                    copyBtn.textContent = 'Copy URL';
                }, 1500);
            }, function() {
                copyBtn.textContent = 'Copy failed, please copy manually';
            });
        });
    }
}); 