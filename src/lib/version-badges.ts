#!/usr/bin/env node

import fs from "fs";
import path from "path";
import * as simpleIcons from "simple-icons";
import { Color } from "csspectrum";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
if (!fs.existsSync(packageJsonPath)) {
    console.error("No package.json found in the current directory.");
    process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: { [key: string]: string };
    devDependencies?: { [key: string]: string };
};

const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
};

function generateBadge(dep: string, version: string): void {
    if (dep.startsWith("@types/")) {
        return;
    }

    const baseName = dep.toLowerCase().replace(/[^a-z0-9]/g, "");
    const iconKey = `si${baseName.charAt(0).toUpperCase() + baseName.slice(1)}` as keyof typeof simpleIcons;
    const icon = simpleIcons[iconKey];

    if (!icon) {
        return;
    }

    const cleanVersion = version.replace(/^[^\d]*/, "");
    const hexColor = `#${icon.hex}`;
    const logo = icon.slug;
    const badgeLabel = dep.replace(/[\s-]/g, "");

    const badge = `![${dep} version](https://img.shields.io/badge/${encodeURIComponent(badgeLabel)}-${cleanVersion}-${icon.hex}?logo=${logo}&logoColor=white)`;

    const rgb = Color.from(hexColor).in("rgb").getArray();
    const [r, g, b] = rgb;

    const textColor = Color.from(hexColor).isDark() ? "\x1b[97m" : "\x1b[30m";

    const backgroundColor = `\x1b[48;2;${r};${g};${b}m`;
    const reset = "\x1b[0m";

    console.log(`${backgroundColor}${textColor}${badge}${reset}`);
}

Object.entries(allDeps).forEach(([dep, version]) => {
    generateBadge(dep, version as string);
});
