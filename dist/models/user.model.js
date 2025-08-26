"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.User = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const argon2_1 = __importDefault(require("argon2"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = require("mongoose");
const product_model_1 = require("./product.model");
let User = class User {
    // @prop({
    //   type: () => ({
    //     pushNotifications: Boolean,
    //     emailNotifications: Boolean,
    //     smsNotifications: Boolean,
    //     marketingEmails: Boolean,
    //   }),
    //   default: {
    //     pushNotifications: true,
    //     emailNotifications: true,
    //     smsNotifications: false,
    //     marketingEmails: false,
    //   },
    // })
    // preferences: {
    //   pushNotifications: boolean;
    //   emailNotifications: boolean;
    //   smsNotifications: boolean;
    //   marketingEmails: boolean;
    // };
    // @prop({
    //   type: () => ({
    //     stripeCustomerId: String,
    //     paypalEmail: String,
    //   }),
    // })
    // paymentProfiles?: {
    //   stripeCustomerId?: string;
    //   paypalEmail?: string;
    // };
    comparePassword(candidatePassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isMatch = yield argon2_1.default.verify(this.password, candidatePassword);
                return isMatch;
            }
            catch (error) {
                logger_1.default.error(error, "could not compare password");
                return false;
            }
        });
    }
    toJson() {
        const userObject = this.toObject();
        delete userObject.password;
        delete userObject.passwordResetCode;
        delete userObject.verificationCode;
        // delete userObject.paymentMethods;
        // delete userObject.paymentProfiles;
        return userObject;
    }
    getDefaultAddress() {
        // return this.addresses.find((address) => address.isDefault);
    }
    getDefaultPaymentMethod() {
        // return this.paymentMethods?.find((method) => method.isDefault);
    }
    addToWishlist(productId) {
        const productRef = typeof productId === "string" ? new mongoose_1.Types.ObjectId(productId) : productId;
        if (!this.wishlist.some((id) => (id === null || id === void 0 ? void 0 : id.toString()) === productRef.toString())) {
            this.wishlist.push(productRef);
        }
    }
    removeFromWishlist(productId) {
        const productRef = typeof productId === "string" ? new mongoose_1.Types.ObjectId(productId) : productId;
        this.wishlist = this.wishlist.filter((id) => (id === null || id === void 0 ? void 0 : id.toString()) !== productRef.toString());
    }
    hasProductInWishlist(productId) {
        const productRef = typeof productId === "string" ? new mongoose_1.Types.ObjectId(productId) : productId;
        return this.wishlist.some((id) => (id === null || id === void 0 ? void 0 : id.toString()) === productRef.toString());
    }
    updateLastLogin() {
        this.lastLogin = new Date();
        return this.save();
    }
    setDefaultAddress(addressIndex) {
        // this.addresses = this.addresses.map((address, index) => ({
        //   ...address,
        //   isDefault: index === addressIndex,
        // }));
    }
    setDefaultPaymentMethod(methodIndex) {
        // if (this.paymentMethods) {
        //   this.paymentMethods = this.paymentMethods.map((method, index) => ({
        //     ...method,
        //     isDefault: index === methodIndex,
        //   }));
        // }
    }
};
exports.User = User;
__decorate([
    (0, typegoose_1.prop)({ lowercase: true, required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: "user", enum: ["user", "admin", "sub-admin"] }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "verificationCode", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Object)
], User.prototype, "passwordResetCode", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => product_model_1.Product, default: [] }),
    __metadata("design:type", Array)
], User.prototype, "wishlist", void 0);
exports.User = User = __decorate([
    (0, typegoose_1.pre)("save", function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isModified("password")) {
                return;
            }
            const hashedPassword = yield argon2_1.default.hash(this.password);
            this.password = hashedPassword;
            return;
        });
    }),
    (0, typegoose_1.index)({ email: 1 }),
    (0, typegoose_1.modelOptions)({
        schemaOptions: {
            timestamps: true,
        },
        options: {
            allowMixed: typegoose_1.Severity.ALLOW,
        },
    })
], User);
const UserModel = (0, typegoose_1.getModelForClass)(User);
exports.default = UserModel;
