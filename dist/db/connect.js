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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("config"));
function connectDocumentDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbUri = config_1.default.get("dbUri");
        try {
            yield (0, mongoose_1.connect)(dbUri);
            logger_1.default.info("DocumentDB Connected!");
            return;
        }
        catch (err) {
            logger_1.default.error("DocumentDB Connection Failed!");
            throw Error(err);
        }
    });
}
exports.default = connectDocumentDB;
