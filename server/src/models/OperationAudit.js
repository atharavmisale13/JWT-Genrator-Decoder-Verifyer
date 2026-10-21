import mongoose from "mongoose";

const operationAuditSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      maxlength: 100,
    },

    operation: {
      type: String,
      required: true,
      enum: ["GENERATE", "DECODE", "VERIFY"],
    },

    algorithm: {
      type: String,
      enum: ["HS256", "RS256", "ES256", "PS256"],
    },

    status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILURE"],
    },

    errorCode: {
      type: String,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  }
);

operationAuditSchema.index({ createdAt: -1 });
operationAuditSchema.index({ requestId: 1 });

export const OperationAudit =
  mongoose.models.OperationAudit ||
  mongoose.model("OperationAudit", operationAuditSchema);