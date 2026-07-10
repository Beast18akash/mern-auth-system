import mongoose from "mongoose";

/**
 * Provider subdocument schema.
 *
 * Instead of adding a new top-level field (googleId, githubId, facebookId...)
 * for every authentication provider, we store all linked providers in a single
 * array. Adding a new provider never requires a schema change — just push a
 * new entry into this array.
 *
 * Examples:
 *   { provider: "local",  providerId: null,          linkedAt: Date }
 *   { provider: "google", providerId: "10928374623",  linkedAt: Date }
 *   { provider: "github", providerId: "983472394",    linkedAt: Date }
 */
const providerSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            required: true,
            enum: ["local", "google", "github"],
        },
        providerId: {
            type: String,
            default: null,
        },
        linkedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false } // No separate _id for subdocuments — keeps the array clean
);

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // Always normalize to lowercase to prevent duplicate accounts
            trim: true,
        },

        /**
         * Password is optional — only set when the user has local auth enabled.
         * OAuth-only users (Google, GitHub) will have this as null/undefined.
         * When a social user later adds a password, local is added to providers[].
         */
        password: {
            type: String,
            default: null,
        },

        /**
         * The scalable provider array.
         * Query pattern: User.findOne({ "providers.provider": "google", "providers.providerId": id })
         * Link pattern:  user.providers.push({ provider: "github", providerId: id })
         */
        providers: {
            type: [providerSchema],
            default: [],
        },

        profilePicture: {
            type: String,
            default: null,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        // Password reset fields — only used by local auth flow
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

/**
 * Helper method — check if a specific provider is already linked.
 * Usage: user.hasProvider("github")
 */
userSchema.methods.hasProvider = function (providerName) {
    return this.providers.some((p) => p.provider === providerName);
};

/**
 * Helper method — link a new provider if not already linked.
 * Usage: user.linkProvider("github", "983472394")
 * Returns true if linked, false if it was already linked.
 */
userSchema.methods.linkProvider = function (providerName, providerId) {
    const alreadyLinked = this.providers.some(
        (p) => p.provider === providerName
    );

    if (!alreadyLinked) {
        this.providers.push({
            provider: providerName,
            providerId: providerId ?? null,
            linkedAt: new Date(),
        });
        return true;
    }

    return false;
};

export default mongoose.model("User", userSchema);
