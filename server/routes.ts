import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import passport from "passport";
import { redirectUrls } from "./config/oauth";
import * as jwt from "jsonwebtoken";
import { jwtConfig } from "./config/oauth";
import { SignOptions } from "jsonwebtoken";

// Schema validation for form submission
const formSubmissionSchema = z.object({
  formId: z.string().uuid(),
  data: z.record(z.any())
});

// Middleware để yêu cầu xác thực
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Kiểm tra xem có token JWT trong header không
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      // @ts-ignore
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }
  
  res.status(401).json({ error: 'Unauthorized' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Khởi tạo passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Auth routes
  
  // Google OAuth login route
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })
  );
  
  // Google OAuth callback route
  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: redirectUrls.failureRedirect,
      session: true
    }),
    (req, res) => {
      try {
        // Tạo JWT token
        const user = req.user as any;
        const token = jwt.sign({ id: user.id, username: user.username }, jwtConfig.secret, {
          expiresIn: jwtConfig.expiresIn
        } as SignOptions);
        
        // Trả về token trong cookie hoặc redirect với token
        res.cookie('jwt', token, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Thêm token vào URL redirect
        let redirectUrl = redirectUrls.successRedirect;
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `token=${token}`;
        
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('JWT signing error:', error);
        res.redirect(redirectUrls.failureRedirect);
      }
    }
  );
  
  // Local login route
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Đăng nhập thất bại' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        
        try {
          // Tạo JWT token
          const token = jwt.sign({ id: user.id, username: user.username }, jwtConfig.secret, {
            expiresIn: jwtConfig.expiresIn
          } as SignOptions);
          
          return res.json({ 
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              displayName: user.display_name,
              profilePicture: user.profile_picture
            },
            token 
          });
        } catch (error) {
          console.error('JWT signing error:', error);
          return res.status(500).json({ error: 'Lỗi tạo token' });
        }
      });
    })(req, res, next);
  });
  
  // Logout route
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) { 
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Đăng xuất thất bại' }); 
      }
      res.clearCookie('jwt');
      res.json({ success: true, message: 'Đăng xuất thành công' });
    });
  });
  
  // Kiểm tra trạng thái đăng nhập
  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({ 
        authenticated: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          profilePicture: user.profile_picture
        }
      });
    }
    
    // Kiểm tra JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        return res.json({ 
          authenticated: true, 
          user: decoded
        });
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }
    
    res.json({ authenticated: false });
  });
  
  // API routes
  
  // Proxy route for GraphQL API
  app.post('/api/graphql', async (req, res) => {
    try {
      const response = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('GraphQL proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch data from GraphQL API' });
    }
  });

  // Submit form data
  app.post('/api/form-submissions', async (req, res) => {
    try {
      const validatedData = formSubmissionSchema.parse(req.body);
      
      // Here you would typically save the submission to your database
      // For now, we'll just return success
      
      res.status(201).json({ 
        success: true, 
        message: 'Form submitted successfully',
        data: validatedData
      });
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors
        });
      }
      
      res.status(500).json({ error: 'Failed to submit form' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
