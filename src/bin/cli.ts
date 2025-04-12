#!/usr/bin/env node

import fs from "fs";
import path from "path";

const [, , command] = process.argv;

const libDir = path.join(__dirname, "../lib");

const availableCommands = fs
    .readdirSync(libDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => file.replace(".js", ""));

if (!command) {
    console.error("No command provided.");
    console.error("Usage: npx @ganemedelabs/cli <command>");
    console.error("Available commands:", availableCommands.join(", "));
    process.exit(1);
}

if (availableCommands.includes(command)) {
    require(`../lib/${command}`);
} else {
    console.error(`Unknown command: ${command}`);
    console.error("Usage: npx @ganemedelabs/cli <command>");
    console.error("Available commands:", availableCommands.join(", "));
    process.exit(1);
}
