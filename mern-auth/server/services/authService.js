import User from "../models/User.js";

/**
 * Find or create a user after a successful OAuth authentication.
 *
 * This is the Account Linking Layer. Every OAuth provider (Google, GitHub,
 * and any future provider) calls this exact same function. The provider-specific
 * code only handles talking to the external API. The account logic lives here, once.
 *
 * The four cases this function handles:
 *
 *   Case A — No user with this email exists.
 *            → Create a new user, link the provider, return the user.
 *
 *   Case B — A user exists with this email, but this provider is not linked yet.
 *            → This means they previously registered via local auth or a different
 *               OAuth provider. Link the new provider to their existing account.
 *            → ONE EMAIL = ONE ACCOUNT. Never create a duplicate.
 *
 *   Case C — A user exists with this email, and this provider is already linked.
 *            → Normal returning login. Just return the user.
 *
 * @param {string} providerName   - "google" | "github"
 * @param {string} providerId     - The unique ID from the external provider
 * @param {object} profile        - Normalized profile from the provider
 * @param {string} profile.email
 * @param {string} profile.fullname
 * @param {string} [profile.picture]
 *
 * @returns {Promise<object>}     - The Mongoose user document
 */
export const findOrCreateOAuthUser = async (providerName, providerId, profile) => {
    const { email, fullname, picture } = profile;

    // Always normalize email to lowercase before any lookup.
    // Prevents User@Example.com and user@example.com becoming two accounts.
    const normalizedEmail = email.toLowerCase().trim();

    // --- Step 1: Try to find an existing user by email ---
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
        // --- Case B / Case C: User already exists ---

        // linkProvider() checks internally if this provider is already linked.
        // Returns true if it was just linked, false if it was already there.
        const wasLinked = user.linkProvider(providerName, providerId);

        if (wasLinked) {
            // Case B: Provider was not linked — we just linked it.
            // Update profile picture if they don't have one yet.
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }

            await user.save();
        }

        // Case C: Provider was already linked — nothing to update, just return.
        return user;
    }

    // --- Case A: No user with this email. Create a new account. ---
    user = await User.create({
        fullname,
        email: normalizedEmail,
        profilePicture: picture ?? null,
        providers: [
            {
                provider: providerName,
                providerId,
                linkedAt: new Date(),
            },
        ],
    });

    return user;
};

/**
 * Link a provider to an existing user account.
 *
 * Used when an already-authenticated user wants to connect an additional
 * provider to their account (e.g. they are logged in and click "Connect GitHub").
 *
 * @param {string} userId       - MongoDB _id of the authenticated user
 * @param {string} providerName - "google" | "github"
 * @param {string} providerId   - The unique ID from the external provider
 *
 * @returns {Promise<object>}   - The updated user document
 * @throws  {Error}             - If user is not found
 */
export const linkProviderToUser = async (userId, providerName, providerId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    user.linkProvider(providerName, providerId);
    await user.save();

    return user;
};
