import { getSettings } from './settings.js';

export async function generateImage() {
    const prompt = document.getElementById('prompt').value;
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const settings = getSettings();

    if (!prompt) {
        status.textContent = 'Error: Please enter a prompt';
        return;
    }

    status.textContent = 'Generating image...';
    result.style.display = 'none';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, settings }),
        });

        const data = await response.json();
        
        if (response.ok && data.image_paths && data.image_paths.length > 0) {
            const imagePath = data.image_paths[0];
            const imageFileName = imagePath.split('/').pop();
            result.src = `/image/${imageFileName}?t=${new Date().getTime()}`;
            result.style.display = 'block';
            document.getElementById('downloadBtn').style.display = 'block';
            status.textContent = 'Image generated successfully!';
        } else {
            console.error('Error response:', data);
            const errorDetail = data.detail || 'Unknown error occurred';
            status.textContent = `Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        status.textContent = `Error: ${error.message || 'Failed to generate image'}`;
    }
}

export function downloadImage() {
    const result = document.getElementById('result');
    const link = document.createElement('a');
    link.href = result.src;
    link.download = 'generated_image.png';
    link.click();
}
