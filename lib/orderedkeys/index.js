"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chars = exports.decode = exports.encode = void 0;
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
var LARGEST_DIGIT = Math.ceil(log64(MAX_SAFE_INTEGER));
function encode(key) {
    if (key > MAX_SAFE_INTEGER) {
        throw new Error("Key overflow. Must be less than " + MAX_SAFE_INTEGER);
    }
    if (key < 0) {
        throw new Error("Key must be non negative");
    }
    var arr = [];
    for (var i = LARGEST_DIGIT; i > 0; i--) {
        var base = Math.pow(64, i);
        if (key >= base) {
            arr.push(exports.chars[Math.floor(key / base)]);
            key = key % base;
        }
        else {
            arr.push(exports.chars[0]);
        }
    }
    arr.push(exports.chars[key]);
    return arr.join('');
}
exports.encode = encode;
function decode(key) {
    var number = 0;
    for (var i = key.length - 1; i >= 0; i--) {
        number += decoder[key.charAt(i)] * Math.pow(64, key.length - 1 - i);
    }
    return number;
}
exports.decode = decode;
function log64(input) {
    return Math.log(input) / Math.log(64);
}
// taken from https://github.com/dominictarr/d64
exports.chars = [
    '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
    'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z', '_', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
    'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];
var decoder = {
    '.': 0, '0': 1, '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7,
    '7': 8, '8': 9, '9': 10, 'A': 11, 'B': 12, 'C': 13, 'D': 14,
    'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20, 'K': 21,
    'L': 22, 'M': 23, 'N': 24, 'O': 25, 'P': 26, 'Q': 27, 'R': 28,
    'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35,
    'Z': 36, '_': 37, 'a': 38, 'b': 39, 'c': 40, 'd': 41, 'e': 42,
    'f': 43, 'g': 44, 'h': 45, 'i': 46, 'j': 47, 'k': 48, 'l': 49,
    'm': 50, 'n': 51, 'o': 52, 'p': 53, 'q': 54, 'r': 55, 's': 56,
    't': 57, 'u': 58, 'v': 59, 'w': 60, 'x': 61, 'y': 62, 'z': 63,
};
