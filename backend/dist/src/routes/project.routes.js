"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProjectController = __importStar(require("../controllers/project.controller"));
const TranslationController = __importStar(require("../controllers/translation.controller"));
const router = (0, express_1.Router)();
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)();
router.post('/', ProjectController.create);
router.get('/:id', ProjectController.get);
router.post('/:id/research', ProjectController.startResearch);
router.post('/:id/select-title', ProjectController.selectTitle);
router.post('/:id/generate', ProjectController.generateBookContent);
router.patch('/:id', ProjectController.update);
router.post('/:id/send-email', upload.single('file'), ProjectController.sendBookEmail);
router.post('/:id/generate-extras', ProjectController.generateExtras);
router.post('/upload-existing', upload.single('file'), ProjectController.uploadExistingBook);
router.post('/process-diagram-lead', ProjectController.processDiagramLead);
router.post('/:id/regenerate-docx', ProjectController.regenerateDocx);
router.post('/find-id-by-email', ProjectController.findIdByEmail);
router.post('/:id/translate', TranslationController.translateBook);
exports.default = router;
