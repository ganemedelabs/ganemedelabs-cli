const BLACK = "\x1b[0;30m";
const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[0;33m";
const BLUE = "\x1b[0;34m";
const PURPLE = "\x1b[0;35m";
const CYAN = "\x1b[0;36m";
const WHITE = "\x1b[0;37m";
const RESET = "\x1b[0m";

function black(text: string) {
    return `${BLACK}${text}${RESET}`;
}

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

function purple(text: string) {
    return `${PURPLE}${text}${RESET}`;
}

function cyan(text: string) {
    return `${CYAN}${text}${RESET}`;
}

function white(text: string) {
    return `${WHITE}${text}${RESET}`;
}

export { black, red, green, yellow, blue, purple, cyan, white };
