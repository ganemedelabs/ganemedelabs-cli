import { Color } from "csspectrum";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import pngToIco from "png-to-ico";
import { parseArgs } from "../utils/utils";
import { highlight } from "cli-highlight";
import { red } from "../utils/colors";

async function main() {
    const argv = parseArgs(process.argv.slice(2));
    const isNextJs = argv.next !== undefined;
    const noPadding = argv["no-padding"];

    const imagePath = argv.image || path.join(__dirname, "../assets/logo.png");
    const themeColorInput = argv.theme || "#FFFFFF";
    const themeColorHex = Color.from(themeColorInput).to("hex");

    const themeColor = Color.from(themeColorHex).in("rgb").getComponents();

    if (!fs.existsSync(imagePath)) {
        console.error(red(`❌ Image not found: ${imagePath}`));
        process.exit(1);
    }

    const outputDir = path.join(process.cwd(), "images/favicons");
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
    const padding = noPadding ? 0 : 20;
    const canvasSize = appleSize + padding * 2;

    const background = await sharp({
        create: {
            width: canvasSize,
            height: canvasSize,
            channels: 4,
            background: themeColor,
        },
    })
        .png()
        .toBuffer();

    const resizedImage = await sharp(imagePath)
        .resize(appleSize, appleSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

    await sharp(background)
        .composite([{ input: resizedImage, gravity: "center" }])
        .toFile(path.join(outputDir, "apple-touch-icon.png"));

    const icoSizes = [16, 32, 64];
    const icoBuffers = await Promise.all(icoSizes.map((size) => sharp(imagePath).resize(size, size).png().toBuffer()));
    const icoBuffer = await pngToIco(icoBuffers);
    fs.writeFileSync(path.join(rootDir, "favicon.ico"), icoBuffer);

    const highlightCode = (text: string, lang: string) => {
        try {
            /* eslint-disable indent */
            const hljsLang =
                lang === "tsx" || lang === "ts"
                    ? "typescript"
                    : lang === "json"
                      ? "json"
                      : lang === "html"
                        ? "xml"
                        : "javascript";
            /* eslint-enable indent */
            return highlight(text, {
                language: hljsLang,
                ignoreIllegals: true,
            });
        } catch {
            return text;
        }
    };

    if (isNextJs) {
        const layoutContent = `
export const metadata = {
    manifest: "/manifest.json",
    icons: {
        icon: [
            { rel: "icon", type: "image/png", sizes: "96x96", url: "/images/favicons/favicon-96x96.png" },
            { rel: "icon", type: "image/png", sizes: "32x32", url: "/images/favicons/favicon-32x32.png" },
            { rel: "icon", type: "image/png", sizes: "16x16", url: "/images/favicons/favicon-16x16.png" },
        ],
        apple: "/images/favicons/apple-touch-icon.png",
    },
};

export const viewport = {
    themeColor: "${themeColorHex}",
};
`;

        const manifestContent = `
export default function manifest() {
    return {
        icons: [
            {
                src: "/favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon",
            },
            {
                src: "/images/favicons/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/images/favicons/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
        theme_color: "${themeColorHex}",
        background_color: "${themeColorHex}",
    };
}
`;

        console.log(`
1. Add the following to your app/layout.tsx file:

${highlightCode(layoutContent.trim(), "tsx")}

2. Create an app/manifest.ts file with the following content:

${highlightCode(manifestContent.trim(), "ts")}
`);
    } else {
        const manifestFields = {
            icons: [
                {
                    src: "/favicon.ico",
                    sizes: "64x64 32x32 24x24 16x16",
                    type: "image/x-icon",
                },
                {
                    src: "/images/favicons/android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "/images/favicons/android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
            ],
            theme_color: themeColorHex,
            background_color: themeColorHex,
        };

        const htmlContent = `
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" sizes="180x180" href="/images/favicons/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/images/favicons/favicon-96x96.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/images/favicons/favicon-16x16.png" />
<meta name="theme-color" content="${themeColorHex}" />
`;

        const jsonString = JSON.stringify(manifestFields, null, 2);
        console.log(`
1. Place the following HTML tags in the <head> section of your HTML file:

${highlightCode(htmlContent.trim(), "html")}

2. Place the following fields in a manifest.json file in your root directory:

${highlightCode(jsonString, "json")}
`);
    }
}

main().catch((error) => {
    console.error(red(`❌ Error: ${error.message}`));
    process.exit(1);
});
