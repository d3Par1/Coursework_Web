// services/oauth.js
// Configures passport strategies for external identity providers.
// Each strategy is conditionally registered — if the matching env vars are
// missing, the strategy is skipped and the corresponding UI button hides.
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_CALLBACK_BASE,
} = process.env;

const googleEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (googleEnabled) {
  const callbackBase = OAUTH_CALLBACK_BASE || ''; // empty = relative URL (works in any env)
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${callbackBase}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || `${googleId}@google.local`;
        const name = profile.displayName || email.split('@')[0];
        const avatarUrl = profile.photos && profile.photos[0] && profile.photos[0].value;

        // Match by Google ID first (stable identifier), then by email (link path).
        let user = User.findByGoogleId(googleId);
        if (!user) {
          const existing = User.findByEmail(email);
          if (existing) {
            // Link Google to the existing email-based account.
            User.linkProvider(existing.id, 'google', googleId, avatarUrl);
            user = User.findById(existing.id);
          } else {
            user = User.createFromOAuth({
              name, email, provider: 'google', providerId: googleId, avatarUrl,
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

// We don't use passport's session integration — login routes do their own
// req.session.regenerate() to preserve the existing session-fixation defense.
// These serializers are only needed for in-flight authenticate() to satisfy
// passport's internal expectations when { session: false } is used.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  try {
    done(null, User.findById(id));
  } catch (err) {
    done(err);
  }
});

module.exports = {
  passport,
  googleEnabled,
};
