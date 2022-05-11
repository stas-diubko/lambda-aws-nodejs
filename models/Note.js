const mongoose = require("mongoose");
const validator = require("validator");

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      validator: {
        validator(title) {
          return validator.isAlphanumeric(title);
        },
      },
    },
    description: {
      type: String,
      required: true,
      validator: {
        validator(description) {
          return validator.isAlphanumeric(description);
        },
      },
    },
    reminder: {
      type: Boolean,
      require: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", NoteSchema);
