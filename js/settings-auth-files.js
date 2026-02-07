// Authentication files management: list, selection, upload/download, and actions

// Elements
const selectAllBtn = document.getElementById('select-all-btn');
const deleteBtn = document.getElementById('delete-btn');
const authFilesList = document.getElementById('auth-files-list');
const authLoading = document.getElementById('auth-loading');

// New dropdown elements
const newDropdown = document.getElementById('new-dropdown');
const newBtn = document.getElementById('new-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const downloadBtn = document.getElementById('download-btn');

// State
let selectedAuthFiles = new Set();
let authFiles = [];

// Load auth files from server
async function loadAuthFiles() {
    try {
        authFiles = await configManager.getAuthFiles();
        renderAuthFiles();
        updateActionButtons();
    } catch (error) {
        console.error('Error loading auth files:', error);
        showError('网络错误');
        showEmptyAuthFiles();
        updateActionButtons();
    }
}

// Render auth files list
function renderAuthFiles() {
    authLoading.style.display = 'none';
    if (authFiles.length === 0) {
        showEmptyAuthFiles();
        return;
    }
    authFilesList.innerHTML = '';
    authFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'auth-file-item';
        fileItem.dataset.filename = file.name;

        const fileSize = formatFileSize(file.size);
        const modTime = formatDate(file.modtime);

        fileItem.innerHTML = `
            <div class="auth-file-info">
                <div class="auth-file-name">${file.name}</div>
                <div class="auth-file-details">
                    <span class="auth-file-type">类型：${file.type || '未知'}</span>
                    <span class="auth-file-size">${fileSize}</span>
                    <span>修改时间：${modTime}</span>
                </div>
            </div>
        `;

        fileItem.addEventListener('click', () => toggleAuthFileSelection(file.name, fileItem));
        authFilesList.appendChild(fileItem);
    });
}

// Empty state for auth files
function showEmptyAuthFiles() {
    authLoading.style.display = 'none';
    authFilesList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <div class="empty-state-text">暂无认证文件</div>
            <div class="empty-state-subtitle">上传认证文件以在此管理</div>
        </div>
    `;
    updateActionButtons();
}

// Toggle selection of an auth file
function toggleAuthFileSelection(filename, fileItem) {
    if (selectedAuthFiles.has(filename)) {
        selectedAuthFiles.delete(filename);
        fileItem.classList.remove('selected');
    } else {
        selectedAuthFiles.add(filename);
        fileItem.classList.add('selected');
    }
    updateActionButtons();
}

// Update action buttons based on current tab/state
function updateActionButtons() {
    const hasSelection = selectedAuthFiles.size > 0;
    const allSelected = selectedAuthFiles.size === authFiles.length && authFiles.length > 0;
    const currentTab = document.querySelector('.tab.active').getAttribute('data-tab');
    if (currentTab === 'auth') {
        resetBtn.style.display = 'none';
        applyBtn.style.display = 'none';
        selectAllBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
        newDropdown.style.display = 'block';
        downloadBtn.style.display = 'block';
        selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        deleteBtn.disabled = !hasSelection;
        downloadBtn.disabled = !hasSelection;
    } else if (currentTab === 'access-token' || currentTab === 'api' || currentTab === 'openai' || currentTab === 'basic') {
        resetBtn.style.display = 'block';
        applyBtn.style.display = 'block';
        selectAllBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        newDropdown.style.display = 'none';
        downloadBtn.style.display = 'none';
    }
}

// Toggle select all auth files
function toggleSelectAllAuthFiles() {
    const allSelected = selectedAuthFiles.size === authFiles.length;
    if (allSelected) {
        selectedAuthFiles.clear();
        document.querySelectorAll('.auth-file-item').forEach(item => item.classList.remove('selected'));
    } else {
        selectedAuthFiles.clear();
        authFiles.forEach(file => selectedAuthFiles.add(file.name));
        document.querySelectorAll('.auth-file-item').forEach(item => item.classList.add('selected'));
    }
    updateActionButtons();
}

// Delete selected auth files
async function deleteSelectedAuthFiles() {
    if (selectedAuthFiles.size === 0 || deleteBtn.disabled) return;
    const fileCount = selectedAuthFiles.size;
    const fileText = '个文件';
    showConfirmDialog(
        '确认删除',
        `确定要删除 ${fileCount} 个认证文件吗？\n此操作不可撤销。`,
        async () => {
            deleteBtn.disabled = true;
            deleteBtn.textContent = '删除中...';
            try {
                const result = await configManager.deleteAuthFiles(Array.from(selectedAuthFiles));
                if (result.success) {
                    showSuccessMessage(`已成功删除 ${result.successCount} 个文件`);
                    selectedAuthFiles.clear();
                    await loadAuthFiles();
                } else {
                    if (result.error) {
                        showError(result.error);
                    } else {
                        showError(`${result.errorCount} 个文件删除失败`);
                    }
                }
            } catch (error) {
                console.error('Error deleting auth files:', error);
                showError('网络错误');
            } finally {
                deleteBtn.disabled = false;
                deleteBtn.textContent = '删除';
                updateActionButtons();
            }
        }
    );
}

// Toggle dropdown menu visibility
function toggleDropdown() {
    dropdownMenu.classList.toggle('show');
}

// Close dropdown menu
function closeDropdown() {
    dropdownMenu.classList.remove('show');
}

// Create a new auth file by type
function createNewAuthFile(type) {
    const typeNames = {
        'gemini': 'Gemini CLI',
        'gemini-web': 'Gemini WEB',
        'claude': 'Claude Code',
        'codex': 'Codex',
        'qwen': 'Qwen Code',
        'vertex': 'Vertex',
        'iflow': 'iFlow',
        'antigravity': 'Antigravity',
        'local': '本地文件'
    };

    if (type === 'local') {
        uploadLocalFile();
    } else if (type === 'codex') {
        startCodexAuthFlow();
    } else if (type === 'claude') {
        startClaudeAuthFlow();
    } else if (type === 'gemini') {
        showGeminiProjectIdDialog();
    } else if (type === 'gemini-web') {
        showGeminiWebDialog();
    } else if (type === 'qwen') {
        startQwenAuthFlow();
    } else if (type === 'vertex') {
        showVertexImportDialog();
    } else if (type === 'antigravity') {
        startAntigravityAuthFlow();
    } else if (type === 'iflow') {
        startIFlowCookieFlow();
    } else {
        console.log(`Creating new ${typeNames[type]} auth file`);
        showSuccessMessage(`正在创建 ${typeNames[type]} 认证文件...`);
    }
}

// Show Gemini Web dialog
function showGeminiWebDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'gemini-web-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Gemini WEB 认证</h3>
                <button class="modal-close" id="gemini-web-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="codex-auth-content">
                    <p>请输入您的 Gemini Web Cookie：</p>
                    <div class="form-group">
                        <label for="gemini-web-secure-1psid-input">Secure-1PSID:</label>
                        <input type="text" id="gemini-web-secure-1psid-input" class="form-input" placeholder="请输入 Secure-1PSID">
                    </div>
                    <div class="form-group">
                        <label for="gemini-web-secure-1psidts-input">Secure-1PSIDTS:</label>
                        <input type="text" id="gemini-web-secure-1psidts-input" class="form-input" placeholder="请输入 Secure-1PSIDTS">
                    </div>
                    <div class="form-group">
                        <label for="gemini-web-email-input" style="text-align: left;">Email:</label>
                        <input type="email" id="gemini-web-email-input" class="form-input" placeholder="请输入邮箱地址">
                    </div>
                    <div class="auth-actions">
                        <button type="button" id="gemini-web-confirm-btn" class="btn-primary">确认</button>
                        <button type="button" id="gemini-web-cancel-btn" class="btn-cancel">取消</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('gemini-web-modal-close').addEventListener('click', cancelGeminiWebDialog);
    document.getElementById('gemini-web-confirm-btn').addEventListener('click', confirmGeminiWebTokens);
    document.getElementById('gemini-web-cancel-btn').addEventListener('click', cancelGeminiWebDialog);
    document.addEventListener('keydown', handleGeminiWebEscapeKey);
    document.getElementById('gemini-web-secure-1psid-input').focus();
}

// Handle Gemini Web dialog escape key
function handleGeminiWebEscapeKey(e) {
    if (e.key === 'Escape') {
        cancelGeminiWebDialog();
    }
}

// Cancel Gemini Web dialog
function cancelGeminiWebDialog() {
    document.removeEventListener('keydown', handleGeminiWebEscapeKey);
    const modal = document.getElementById('gemini-web-modal');
    if (modal) modal.remove();
}

// Confirm Gemini Web tokens
async function confirmGeminiWebTokens() {
    try {
        const emailInput = document.getElementById('gemini-web-email-input');
        const secure1psidInput = document.getElementById('gemini-web-secure-1psid-input');
        const secure1psidtsInput = document.getElementById('gemini-web-secure-1psidts-input');

        const email = emailInput.value.trim();
        const secure1psid = secure1psidInput.value.trim();
        const secure1psidts = secure1psidtsInput.value.trim();

        if (!email || !secure1psid || !secure1psidts) {
            showError('请输入邮箱、Secure-1PSID 和 Secure-1PSIDTS');
            return;
        }

        cancelGeminiWebDialog();

        // Call Management API to save Gemini Web tokens
        const result = await configManager.saveGeminiWebTokens(secure1psid, secure1psidts, email);

        if (result.success) {
            showSuccessMessage('Gemini Web 令牌保存成功');
            // Refresh the auth files list
            await loadAuthFiles();
        } else {
            showError('保存 Gemini Web 令牌失败：' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving Gemini Web tokens:', error);
        showError('保存 Gemini Web 令牌失败：' + error.message);
    }
}

// Upload local JSON files
function uploadLocalFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }
        const invalidFiles = files.filter(file => !file.name.toLowerCase().endsWith('.json'));
        if (invalidFiles.length > 0) {
            showError(`请仅选择 JSON 文件。无效文件：${invalidFiles.map(f => f.name).join(', ')}`);
            document.body.removeChild(fileInput);
            return;
        }
        try {
            await uploadFilesToServer(files);
            await loadAuthFiles();
        } catch (error) {
            console.error('Error uploading files:', error);
            showError('上传文件失败');
        } finally {
            document.body.removeChild(fileInput);
        }
    });
}

// Upload multiple files via config manager
async function uploadFilesToServer(files) {
    try {
        const result = await configManager.uploadAuthFiles(files);
        if (result.success && result.successCount > 0) {
            showSuccessMessage(`已成功上传 ${result.successCount} 个文件`);
        }
        if (result.errorCount > 0) {
            const errorMessage = result.errors && result.errors.length <= 3
                ? `${result.errorCount} 个文件上传失败：${result.errors.join(', ')}`
                : `${result.errorCount} 个文件上传失败`;
            showError(errorMessage);
        }
        if (result.error) {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        showError('上传文件失败');
    }
}

// Legacy single-file upload (kept for compatibility)
async function uploadSingleFile(file, apiUrl, password) {
    console.warn('uploadSingleFile is deprecated, use configManager.uploadAuthFiles() instead');
}

// Download selected auth files
async function downloadSelectedAuthFiles() {
    if (selectedAuthFiles.size === 0 || downloadBtn.disabled) return;
    downloadBtn.disabled = true;
    downloadBtn.textContent = '下载中...';
    try {
        const result = await configManager.downloadAuthFiles(Array.from(selectedAuthFiles));
        if (result.success && result.successCount > 0) {
            showSuccessMessage(`已成功下载 ${result.successCount} 个文件`);
        }
        if (result.errorCount > 0) {
            showError(`${result.errorCount} 个文件下载失败`);
        }
        if (result.error) {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error downloading files:', error);
        showError('下载文件失败');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '下载';
    }
}

// Legacy single-file download (kept for compatibility)
async function downloadFileToDirectory(filename, directoryHandle, baseUrl, password) {
    console.warn('downloadFileToDirectory is deprecated, use configManager.downloadAuthFiles() instead');
}

// Event wiring for auth files UI
selectAllBtn.addEventListener('click', toggleSelectAllAuthFiles);
deleteBtn.addEventListener('click', deleteSelectedAuthFiles);
downloadBtn.addEventListener('click', downloadSelectedAuthFiles);

newBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = item.getAttribute('data-type');
        createNewAuthFile(type);
        closeDropdown();
    });
});

document.addEventListener('click', (e) => {
    if (!newDropdown.contains(e.target)) {
        closeDropdown();
    }
});
