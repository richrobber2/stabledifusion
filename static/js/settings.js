export function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel.style.display === 'none') {
        settingsPanel.style.display = 'block';
        // Force browser reflow
        settingsPanel.offsetHeight;
        settingsPanel.classList.add('visible');
    } else {
        settingsPanel.classList.remove('visible');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
        }, 300); // Match the CSS transition duration
    }
}

export function getSettings() {
    const seedValue = document.getElementById('seed').value;
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
        seed: seedValue === "" ? undefined : parseInt(seedValue),
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

    // Add smooth drag transitions
    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        el.style.transition = isDragging ? 'none' : 'transform 0.2s ease';
    }
}

export function startMemoryMonitoring() {
    const updateMemoryStats = async () => {
        try {
            const response = await fetch('/memory_stats');
            const data = await response.json();
            
            if (data.error) {
                console.error('Memory monitoring error:', data.error);
                return;
            }

            const memoryBar = document.getElementById('memoryUsed');
            const memoryText = document.getElementById('memoryText');
            
            const percentUsed = (data.used / data.total) * 100;
            memoryBar.style.width = `${percentUsed}%`;
            memoryBar.style.backgroundColor = percentUsed > 90 ? '#ff4444' : 
                                            percentUsed > 75 ? '#ffaa44' : 
                                            'var(--accent)';
            
            memoryText.textContent = `${data.used.toFixed(1)} / ${data.total.toFixed(1)} GB`;
        } catch (error) {
            console.error('Failed to fetch memory stats:', error);
        }
    };

    // Update immediately and then every 2 seconds
    updateMemoryStats();
    return setInterval(updateMemoryStats, 2000);
}

document.querySelectorAll('input[type="range"]').forEach(range => {
    const valueDisplay = document.getElementById(`${range.id}_value`);
    range.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
    });
});

makeSettingsPanelDraggable();
startMemoryMonitoring(); // Start monitoring
