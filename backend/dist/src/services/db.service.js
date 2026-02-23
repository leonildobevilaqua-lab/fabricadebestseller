"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadDB = exports.pushVal = exports.setVal = exports.getVal = void 0;
const node_json_db_1 = require("node-json-db");
const db = new node_json_db_1.JsonDB(new node_json_db_1.Config("database", true, false, '/'));
const getVal = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield db.getData(path);
    }
    catch (e) {
        return null;
    }
});
exports.getVal = getVal;
const setVal = (path, value) => __awaiter(void 0, void 0, void 0, function* () {
    yield db.push(path, value);
});
exports.setVal = setVal;
const pushVal = (path, value) => __awaiter(void 0, void 0, void 0, function* () {
    yield db.push(path + "[]", value);
});
exports.pushVal = pushVal;
const reloadDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.reload();
});
exports.reloadDB = reloadDB;
exports.default = { getVal: exports.getVal, setVal: exports.setVal, pushVal: exports.pushVal, reloadDB: exports.reloadDB };
