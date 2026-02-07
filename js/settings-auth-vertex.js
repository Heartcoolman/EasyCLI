// Vertex credential import flow

function showVertexImportDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'vertex-import-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Vertex 凭证导入</h3>
                <button class="modal-close" id="vertex-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="codex-auth-content">
                    <p>上传 Google 服务账号 JSON 文件和可选的 Vertex 区域。</p>
                    <div class="form-group">
                        <label for="vertex-file-input">服务账号 JSON <span class="required">*</span></label>
                        <input type="file" id="vertex-file-input" class="form-input" accept=".json">
                        <small class="form-help">文件名必须以 .json 结尾。</small>
                    </div>
                    <div class="form-group">
                        <label for="vertex-location-input">区域</label>
                        <input type="text" id="vertex-location-input" class="form-input" placeholder="us-central1" value="us-central1">
                        <small class="form-help">留空时默认为 us-central1。</small>
                    </div>
                    <div class="auth-actions">
                        <button type="button" id="vertex-import-btn" class="btn-primary">导入</button>
                        <button type="button" id="vertex-cancel-btn" class="btn-cancel">取消</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const fileInput = document.getElementById('vertex-file-input');
    const locationInput = document.getElementById('vertex-location-input');
    const importBtn = document.getElementById('vertex-import-btn');

    document.getElementById('vertex-modal-close').addEventListener('click', closeVertexImportDialog);
    document.getElementById('vertex-cancel-btn').addEventListener('click', closeVertexImportDialog);
    importBtn.addEventListener('click', () => handleVertexImport(fileInput, locationInput, importBtn));
    document.addEventListener('keydown', handleVertexEscapeKey);

    if (fileInput) {
        fileInput.focus();
    }
}

function handleVertexEscapeKey(e) {
    if (e.key === 'Escape') {
        closeVertexImportDialog();
    }
}

async function handleVertexImport(fileInput, locationInput, importBtn) {
    try {
        const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
        if (files.length === 0) {
            showError('请选择服务账号 JSON 文件');
            return;
        }

        const file = files[0];
        if (!file.name.toLowerCase().endsWith('.json')) {
            showError('服务账号文件必须是 .json 文件');
            return;
        }

        const location = locationInput && locationInput.value ? locationInput.value.trim() : '';
        const resolvedLocation = location || 'us-central1';

        importBtn.disabled = true;
        importBtn.textContent = '导入中...';

        const result = await configManager.importVertexCredential(file, resolvedLocation);

        if (result && result.success) {
            const project = result.data?.project_id ? ` 项目：${result.data.project_id}` : '';
            const locText = result.data?.location ? ` (${result.data.location})` : '';
            showSuccessMessage(`Vertex 凭证已导入${project}${locText}`);
            closeVertexImportDialog();
            if (typeof loadAuthFiles === 'function') {
                await loadAuthFiles();
            }
        } else {
            showError(result?.error || '导入 Vertex 凭证失败');
        }
    } catch (error) {
        console.error('Error importing Vertex credential:', error);
        showError('导入 Vertex 凭证失败：' + error.message);
    } finally {
        if (importBtn) {
            importBtn.disabled = false;
            importBtn.textContent = '导入';
        }
    }
}

function closeVertexImportDialog() {
    document.removeEventListener('keydown', handleVertexEscapeKey);
    const modal = document.getElementById('vertex-import-modal');
    if (modal) {
        modal.remove();
    }
}
