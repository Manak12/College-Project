import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
    },

    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      match: [/.+\@.+\..+/, "Please provide a valid email"],
    },

    passwordHash: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
      select: false, // don’t return hash by default
    },

    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },

    isSubscribed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.getSignedJwtToken = function () {
  const payload = { id: this._id, role: this.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);
export default User;
