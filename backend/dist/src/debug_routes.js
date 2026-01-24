"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
// Function to print routes
function print(path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
    }
    else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
    }
    else if (layer.method) {
        console.log('%s /%s', layer.method.toUpperCase(), path.concat(split(layer.route.path)).filter(Boolean).join('/'));
    }
}
function split(thing) {
    if (typeof thing === 'string') {
        return thing.split('/');
    }
    else if (thing.fast_slash) {
        return '';
    }
    else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>';
    }
}
// Check if _router exists (it should on an express app)
if (app_1.default._router && app_1.default._router.stack) {
    app_1.default._router.stack.forEach(print.bind(null, []));
}
