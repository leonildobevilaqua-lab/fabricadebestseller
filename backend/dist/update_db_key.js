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
const db_service_1 = require("./src/services/db.service");
function updateKey() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Reloading DB...");
        yield (0, db_service_1.reloadDB)();
        const newKey = "AIzaSyBh4hJ7DtY1TMqXDhvKA1wSkehC_rgZZNU";
        console.log("Updating Gemini Key in Database to:", newKey);
        try {
            yield (0, db_service_1.setVal)("/settings/providers/gemini", newKey);
            console.log("Update Success.");
            const check = yield (0, db_service_1.getVal)("/settings/providers/gemini");
            console.log("Verification Read:", check);
            if (check === newKey) {
                console.log("KEY UPDATE CONFIRMED.");
            }
            else {
                console.error("KEY UPDATE FAILED verification.");
            }
        }
        catch (e) {
            console.error("Error updating DB:", e);
        }
    });
}
updateKey();
