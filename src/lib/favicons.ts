import { Color } from "csspectrum";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import minimist from "minimist";
import pngToIco from "png-to-ico";

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[0;33m";
const BLUE = "\x1b[0;34m";
const RESET = "\x1b[0m";

function red(text: string) {
    return `${RED}${text}${RESET}`;
}

function green(text: string) {
    return `${GREEN}${text}${RESET}`;
}

function yellow(text: string) {
    return `${YELLOW}${text}${RESET}`;
}

function blue(text: string) {
    return `${BLUE}${text}${RESET}`;
}

async function generateFavicons() {
    const argv = minimist(process.argv.slice(2));
    const noColor = argv["no-color"] || false;

    const imagePath = argv.image || path.join(__dirname, "../assets/logo.png");
    const themeColorInput = argv.theme || "#FFFFFF";

    const themeColor = Color.from(themeColorInput).in("rgb").getComponents();

    if (!fs.existsSync(imagePath)) {
        console.error(red(`❌ Image not found: ${imagePath}`));
        process.exit(1);
    }

    const outputDir = path.join(process.cwd(), "images", "favicons");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const rootDir = process.cwd();

    const sizes = [
        { name: "android-chrome-192x192.png", size: 192 },
        { name: "android-chrome-512x512.png", size: 512 },
        { name: "favicon-16x16.png", size: 16 },
        { name: "favicon-32x32.png", size: 32 },
        { name: "favicon-96x96.png", size: 96 },
    ];

    for (const { name, size } of sizes) {
        const outputPath = path.join(outputDir, name);
        await sharp(imagePath).resize(size, size).toFile(outputPath);
    }

    const appleSize = 180;
    const background = await sharp({
        create: {
            width: appleSize,
            height: appleSize,
            channels: 4,
            background: themeColor,
        },
    })
        .png()
        .toBuffer();

    const resizedImage = await sharp(imagePath)
        .resize(appleSize, appleSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    await sharp(background)
        .composite([{ input: resizedImage, gravity: "center" }])
        .toFile(path.join(outputDir, "apple-touch-icon.png"));

    const icoSizes = [16, 32, 64];
    const icoBuffers = await Promise.all(icoSizes.map((size) => sharp(imagePath).resize(size, size).png().toBuffer()));
    const icoBuffer = await pngToIco(icoBuffers);
    fs.writeFileSync(path.join(rootDir, "favicon.ico"), icoBuffer);

    const manifestFields = {
        icons: [
            {
                src: "/favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon",
            },
            {
                src: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
        theme_color: themeColorInput,
        background_color: themeColorInput,
    };

    const htmlContent = `
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<meta name="theme-color" content="${themeColorInput}" />
`;

    const highlightHtml = (text: string) => {
        if (noColor) return text;
        return text
            .replace(/(?<=<\/?)[\w-]+/g, (match) => blue(match))
            .replace(/[\w-]+(?==)/g, (match) => yellow(match))
            .replace(/"[^"]*"/g, (match) => green(match));
    };

    const highlightJson = (text: string) => {
        if (noColor) return text;
        return text
            .replace(/"([^"]+)"(?=\s*:)/g, (match) => yellow(match))
            .replace(/:\s*"([^"]*)"/g, (match) => {
                const value = match.match(/"[^"]*"/)?.[0];
                return `: ${green(value!)}`;
            })
            .replace(/:\s*(\d+|true|false|null)/g, (match, val) => `: ${blue(val)}`);
    };

    const highlightedHtml = highlightHtml(htmlContent);
    const jsonString = JSON.stringify(manifestFields, null, 2);
    const highlightedJson = highlightJson(jsonString);

    console.log(`
1. Place the following HTML tags in the <head> section of your HTML file:

${highlightedHtml.trim()}

2. Place the following fields in a manifest.json file in your root directory ${outputDir}:

${highlightedJson}
`);
}

generateFavicons().catch((error) => {
    console.error(red(`❌ Error: ${error.message}`));
    process.exit(1);
});
