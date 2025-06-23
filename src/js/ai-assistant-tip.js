document.addEventListener('DOMContentLoaded', function() {
    var copyBtn = document.getElementById('copy-ai-url');
    var urlBox = document.getElementById('ai-url-box');
    if (copyBtn && urlBox) {
        copyBtn.addEventListener('click', function() {
            var text = urlBox.textContent;
            navigator.clipboard.writeText(text).then(function() {
                copyBtn.textContent = '复制成功！';
                setTimeout(function() {
                    copyBtn.textContent = '复制网址';
                }, 1500);
            }, function() {
                copyBtn.textContent = '复制失败，请手动复制';
            });
        });
    }
}); 