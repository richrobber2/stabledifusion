export function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
}

export function getSettings() {
    return {
        guidance_scale: parseFloat(document.getElementById('guidance_scale').value),
        num_steps: parseInt(document.getElementById('num_steps').value),
        image_size: document.getElementById('image_size').value,
        model_version: document.getElementById('model_version').value,
        use_half_precision: document.getElementById('use_half_precision').checked,
        safety_checker: document.getElementById('safety_checker').checked,
        nsfw_filter: document.getElementById('nsfw_filter').checked,
        output_format: document.getElementById('output_format').value,
        save_metadata: document.getElementById('save_metadata').checked,
        seed: document.getElementById('seed').value ? parseInt(document.getElementById('seed').value) : null,
        num_images: parseInt(document.getElementById('num_images').value),
        eta: parseFloat(document.getElementById('eta').value),
    };
}

export function makeSettingsPanelDraggable() {
    const settingsPanel = document.getElementById('settingsPanel');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    settingsPanel.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === settingsPanel || e.target.closest('.settings-panel')) {
            isDragging = true;
            document.body.classList.add('no-select');
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, settingsPanel);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        document.body.classList.remove('no-select');
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

document.querySelectorAll('input[type="range"]').forEach(range => {
    const valueDisplay = document.getElementById(`${range.id}_value`);
    range.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
    });
});

makeSettingsPanelDraggable();
