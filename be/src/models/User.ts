import { Schema, model, Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { IUser, IUserMethods } from '../types';
import { USER_ROLES, USER_STATUS } from '../utils/constants';

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<any, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't select password by default
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    role: {
      type: String,
      enum: [USER_ROLES.CUSTOMER, USER_ROLES.STAFF, USER_ROLES.ADMIN],
      default: USER_ROLES.CUSTOMER,
    },
    status: {
      type: String,
      enum: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BLOCKED],
      default: USER_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  const doc = this as any;
  if (!doc.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    doc.password = await bcryptjs.hash(doc.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcryptjs.compare(enteredPassword, (this as any).password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = model<IUser, UserModel>('User', userSchema);
