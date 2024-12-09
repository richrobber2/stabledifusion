import { getSettings } from './settings.js';

export async function generateImage() {
    const prompt = document.getElementById('prompt').value;
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const settings = getSettings();

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
        if (response.ok) {
            result.src = `/image/${data.image_paths[0].split('/').pop()}?t=${new Date().getTime()}`;
            result.style.display = 'block';
            document.getElementById('downloadBtn').style.display = 'block';
            status.textContent = 'Image generated successfully!';
        } else {
            status.textContent = `Error: ${data.detail}`;
        }
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
}

export function downloadImage() {
    const result = document.getElementById('result');
    const link = document.createElement('a');
    link.href = result.src;
    link.download = 'generated_image.png';
    link.click();
}
