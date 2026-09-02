import mongoose, { Document, Schema } from "mongoose";
const { USER_ROLES, USER_STATUS } = require("../utils/constants");

export interface IUser extends Document {
    name: string;
    email: string;
    employeeId?: string;
    passwordHash: string;
    role: string;
    status: string;
    profileImage?: string;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        employeeId: { type: String, unique: true, sparse: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            required: true,
        },
        status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
        profileImage: { type: String, default: null },
    },
    { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
module.exports = User;