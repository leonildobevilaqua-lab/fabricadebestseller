const jimp = require('jimp');
const fs = require('fs');

async function optimize() {
    try {
        const imagePath = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/frontend/public/assets/landing/f7acb9e3-2a41-4762-9ea4-679816fcb72a.jpeg';
        const image = await jimp.read(imagePath);
        
        const beforeSize = fs.statSync(imagePath).size;
        console.log(`Original size: ${Math.round(beforeSize / 1024)} KB`);

        // Resize if larger than 800px width (founder image usually doesn't need to be huge)
        if (image.bitmap.width > 800) {
            image.resize(800, jimp.AUTO);
        }
        
        // Compress JPEG
        image.quality(60);
        
        await image.writeAsync(imagePath);
        
        const afterSize = fs.statSync(imagePath).size;
        console.log(`Optimized size: ${Math.round(afterSize / 1024)} KB`);
    } catch (e) {
        console.error("Failed to optimize image:", e);
    }
}

optimize();
