const fs = require('fs');

const path = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/frontend/public/landing.html';
let html = fs.readFileSync(path, 'utf8');

// The founder image uses UUID f7acb9e3-2a41-4762-9ea4-679816fcb72a
const targetUrl = "/assets/landing/f7acb9e3-2a41-4762-9ea4-679816fcb72a.jpeg";

if (html.includes(targetUrl)) {
    // Find where the img tag starts
    html = html.replace(new RegExp(`(<img[^>]*src=["']${targetUrl}["'][^>]*)>`, "g"), (match, p1) => {
        if (!p1.includes("loading=")) {
            return p1 + ' loading="lazy">';
        }
        return match;
    });
    fs.writeFileSync(path, html, 'utf8');
    console.log("Added loading=lazy to Founder image.");
} else {
    console.log("Founder image not found in HTML.");
}
