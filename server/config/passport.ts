import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from '../storage';
import { googleOAuth } from './oauth';
import bcrypt from 'bcrypt';

export function setupPassport() {
  // Cấu hình Passport.js
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Xác thực local
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Tên đăng nhập không đúng' });
        }
        
        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Mật khẩu không đúng' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Xác thực Google
  console.log("Google OAuth config:", {
    clientID: googleOAuth.clientID ? "✓ Set" : "❌ Not set",
    clientSecret: googleOAuth.clientSecret ? "✓ Set" : "❌ Not set",
    callbackURL: googleOAuth.callbackURL
  });
  
  if (googleOAuth.clientID && googleOAuth.clientSecret) {
    console.log("Setting up Google Strategy");
    passport.use(new GoogleStrategy(
      {
        clientID: googleOAuth.clientID,
        clientSecret: googleOAuth.clientSecret,
        callbackURL: googleOAuth.callbackURL,
        proxy: googleOAuth.proxy
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Tìm hoặc tạo user từ profile Google
          const user = await storage.findOrCreateUserFromGoogle(profile);
          
          // Lưu accessToken vào session để sử dụng sau này nếu cần
          if (accessToken) {
            // @ts-ignore
            if (!profile.session) profile.session = {};
            // @ts-ignore
            profile.session.accessToken = accessToken;
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ));
  } else {
    console.warn('Google OAuth không được cấu hình. Google login sẽ không hoạt động.');
  }

  return passport;
}