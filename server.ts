import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import sql from './src/lib/neon.js';
import { migrate } from './src/lib/migrate.js';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  // Run migration on startup if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      await migrate();
    } catch (e) {
      console.error('Migration failed on startup:', e);
    }
  }

  const app = express();
  
  // Trust proxy is required for secure cookies to work behind the AI Studio proxy
  app.set('trust proxy', 1);
  
  // Vite middleware for development
  let vite: any;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  app.use(cors());
  app.use(express.json());

  // Database setup check middleware
  app.use((req, res, next) => {
    if (!process.env.DATABASE_URL && !req.path.startsWith('/api/health')) {
      return res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Neon Database Setup Required</h1>
            <p>Your application is configured to use Neon PostgreSQL, but the <code>DATABASE_URL</code> is missing.</p>
            <p>To fix this, please follow these steps:</p>
            <ol style="margin-bottom: 1.5rem;">
              <li>Go to <a href="https://console.neon.tech/" target="_blank" style="color: #2563eb;">Neon Console</a> and create a project.</li>
              <li>Copy your <strong>Connection String</strong> (it starts with <code>postgresql://...</code>).</li>
              <li>In AI Studio, go to <strong>Settings > Secrets</strong> (⚙️ gear icon, top-right).</li>
              <li>Add a new secret:
                <ul style="margin-top: 5px;">
                  <li>Name: <code>DATABASE_URL</code></li>
                  <li>Value: <code>${req.query.url || 'paste_your_connection_string_here'}</code></li>
                </ul>
              </li>
            </ol>
            <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563eb;">
              <strong>Your Database URL:</strong><br/>
              <code style="word-break: break-all;">postgresql://neondb_owner:npg_eZv3gxAuCz8G@ep-soft-mountain-a1d3umoh-pooler.ap-southeast-1.aws.neon.tech/devanshedutech?sslmode=require</code>
            </div>
            <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #6b7280;">The app will rebuild automatically once you save the secret.</p>
          </body>
        </html>
      `);
    }
    next();
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'devanshe-secret',
    resave: true,
    saveUninitialized: true,
    proxy: true,
    cookie: {
      secure: true, // Required for cross-origin iframe
      sameSite: 'none', // Required for cross-origin iframe
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const users = await sql`SELECT id, email, display_name as "displayName", photo_url as "photoURL", role FROM users WHERE id = ${id} LIMIT 1`;
      if (users.length === 0) {
        return done(null, false);
      }
      done(null, users[0]);
    } catch (e) {
      console.error('Error in deserializeUser:', e);
      done(e);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          console.log(`Login attempt for email: ${email}`);
          const role = email?.toLowerCase() === 'kulkarnianant8975@gmail.com' ? 'admin' : 'user';
          
          const existingUsers = await sql`SELECT * FROM users WHERE id = ${profile.id} LIMIT 1`;
          if (existingUsers.length === 0) {
            console.log(`Creating new user: ${email} with role: ${role}`);
            await sql`
              INSERT INTO users (id, email, display_name, photo_url, role) 
              VALUES (${profile.id}, ${email}, ${profile.displayName}, ${profile.photos?.[0]?.value}, ${role})
            `;
          } else {
            console.log(`Updating existing user: ${email} with role: ${role}`);
            // Update role and info on every login
            await sql`
              UPDATE users 
              SET email = ${email}, display_name = ${profile.displayName}, photo_url = ${profile.photos?.[0]?.value}, role = ${role} 
              WHERE id = ${profile.id}
            `;
          }
          const users = await sql`SELECT id, email, display_name as "displayName", photo_url as "photoURL", role FROM users WHERE id = ${profile.id} LIMIT 1`;
          return done(null, users[0]);
        } catch (e) {
          console.error('Error in Google Strategy callback:', e);
          return done(e);
        }
      }
    ));
  }

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        console.log(`LocalStrategy: Attempting login for ${email}`);
        const users = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
        if (users.length === 0) {
          console.warn(`LocalStrategy: User not found: ${email}`);
          return done(null, false, { message: 'Incorrect email.' });
        }
        const user = users[0];
        if (!user.password) {
          console.warn(`LocalStrategy: User ${email} has no password (uses Google)`);
          return done(null, false, { message: 'This account uses Google Login.' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          console.warn(`LocalStrategy: Invalid password for ${email}`);
          return done(null, false, { message: 'Incorrect password.' });
        }
        console.log(`LocalStrategy: Login successful for ${email}`);
        // Normalize for passport
        const normalizedUser = {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          photoURL: user.photo_url,
          role: user.role
        };
        return done(null, normalizedUser);
      } catch (e) {
        console.error(`LocalStrategy: Error for ${email}:`, e);
        return done(e);
      }
    }
  ));

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      console.log('Registration request received for:', email);
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existing = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
      if (existing.length > 0) {
        console.warn('Registration failed: User already exists:', email);
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const role = email.toLowerCase() === 'kulkarnianant8975@gmail.com' ? 'admin' : 'user';

      console.log(`Creating user ${email} with role ${role}`);
      await sql`
        INSERT INTO users (id, email, password, display_name, role) 
        VALUES (${id}, ${email.toLowerCase()}, ${hashedPassword}, ${displayName || email.split('@')[0]}, ${role})
      `;

      const users = await sql`SELECT id, email, display_name as "displayName", photo_url as "photoURL", role FROM users WHERE id = ${id} LIMIT 1`;
      const user = users[0];

      req.login(user, (err) => {
        if (err) {
          console.error('Login failed after registration:', err);
          return res.status(500).json({ error: 'Login failed after registration' });
        }
        console.log('Registration and login successful for:', email);
        res.status(201).json(user);
      });
    } catch (e) {
      console.error('Registration error:', e);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    console.log('Login request received:', req.body.email);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Passport authenticate error:', err);
        return res.status(500).json({ error: 'Login error' });
      }
      if (!user) {
        console.warn('Login failed for user:', req.body.email, 'Info:', info);
        return res.status(401).json({ error: info?.message || 'Login failed' });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('req.login error:', err);
          return res.status(500).json({ error: 'Session error' });
        }
        console.log('Login successful for user:', user.email);
        res.json(user);
      });
    })(req, res, next);
  });

  // Debug route for auth
  app.get('/api/debug/auth', (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user,
      session: req.session,
      headers: {
        host: req.headers.host,
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-forwarded-proto': req.headers['x-forwarded-proto']
      },
      env: {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  });

  app.get('/auth/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const currentCallbackUrl = `${protocol}://${host}/auth/google/callback`;
      
      return res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">OAuth Configuration Required</h1>
            <p>Google Login is not yet configured. To enable it, please follow these steps:</p>
            <ol style="margin-bottom: 1.5rem;">
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" style="color: #ea580c;">Google Cloud Console</a>.</li>
              <li>Create a new project (or select an existing one).</li>
              <li>Navigate to <strong>APIs & Services > Credentials</strong>.</li>
              <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
              <li>Add this Authorized Redirect URI: <br/>
                <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">${currentCallbackUrl}</code>
              </li>
              <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
              <li>In AI Studio, go to <strong>Settings > Environment Variables</strong> and add:
                <ul style="margin-top: 5px;">
                  <li><code>GOOGLE_CLIENT_ID</code></li>
                  <li><code>GOOGLE_CLIENT_SECRET</code></li>
                </ul>
              </li>
            </ol>
            <button onclick="window.close()" style="background: #ea580c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Close this window</button>
          </body>
        </html>
      `);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${protocol}://${host}/auth/google/callback`;

    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      callbackURL: callbackURL
    } as any)(req, res, next);
  });

  app.get('/auth/google/callback', 
    (req, res, next) => {
      console.log('Google OAuth callback hit');
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('Google OAuth keys missing in callback');
        return res.redirect('/admin');
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${protocol}://${host}/auth/google/callback`;
      
      console.log(`Using callbackURL: ${callbackURL}`);

      passport.authenticate('google', { 
        failureRedirect: '/admin',
        callbackURL: callbackURL
      } as any)(req, res, next);
    },
    (req, res) => {
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/admin';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    }
  );

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Middleware to check for admin role
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  };

  // API Routes
  app.get('/api/courses', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
      let courses;
      if (limit) {
        courses = await sql`SELECT * FROM courses LIMIT ${limit}`;
      } else {
        courses = await sql`SELECT * FROM courses`;
      }
      res.json(courses);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  app.post('/api/courses', isAdmin, async (req, res) => {
    try {
      const { name, description, duration, price, category, image } = req.body;
      const id = uuidv4();
      await sql`
        INSERT INTO courses (id, name, description, duration, price, category, image) 
        VALUES (${id}, ${name}, ${description}, ${duration}, ${price}, ${category}, ${image})
      `;
      
      const courses = await sql`SELECT * FROM courses WHERE id = ${id} LIMIT 1`;
      res.status(201).json(courses[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create course' });
    }
  });

  app.put('/api/courses/:id', isAdmin, async (req, res) => {
    try {
      const { name, description, duration, price, category, image } = req.body;
      await sql`
        UPDATE courses 
        SET name = ${name}, description = ${description}, duration = ${duration}, price = ${price}, category = ${category}, image = ${image} 
        WHERE id = ${req.params.id}
      `;
      
      const courses = await sql`SELECT * FROM courses WHERE id = ${req.params.id} LIMIT 1`;
      res.json(courses[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update course' });
    }
  });

  app.delete('/api/courses/:id', isAdmin, async (req, res) => {
    try {
      await sql`DELETE FROM courses WHERE id = ${req.params.id}`;
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });

  app.get('/api/leads', isAdmin, async (req, res) => {
    try {
      const leads = await sql`
        SELECT id, full_name as "fullName", email, mobile_number as "mobileNumber", 
               education, city_name as "cityName", course_interested as "courseInterested", 
               status, created_at as "createdAt" 
        FROM leads 
        ORDER BY created_at DESC
      `;
      res.json(leads);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  app.post('/api/leads', async (req, res) => {
    try {
      const { fullName, email, mobileNumber, education, cityName, courseInterested } = req.body;
      const id = uuidv4();
      const status = 'New';

      await sql`
        INSERT INTO leads (id, full_name, email, mobile_number, education, city_name, course_interested, status) 
        VALUES (${id}, ${fullName}, ${email}, ${mobileNumber}, ${education}, ${cityName}, ${courseInterested}, ${status})
      `;
      
      const leads = await sql`
        SELECT id, full_name as "fullName", email, mobile_number as "mobileNumber", 
               education, city_name as "cityName", course_interested as "courseInterested", 
               status, created_at as "createdAt" 
        FROM leads 
        WHERE id = ${id} LIMIT 1
      `;
      res.status(201).json(leads[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create lead' });
    }
  });

  app.patch('/api/leads/:id/status', isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      await sql`UPDATE leads SET status = ${status} WHERE id = ${req.params.id}`;
      
      const leads = await sql`
        SELECT id, full_name as "fullName", email, mobile_number as "mobileNumber", 
               education, city_name as "cityName", course_interested as "courseInterested", 
               status, created_at as "createdAt" 
        FROM leads 
        WHERE id = ${req.params.id} LIMIT 1
      `;
      res.json(leads[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update lead status' });
    }
  });

  // Messages API
  app.get('/api/messages', isAdmin, async (req, res) => {
    try {
      const messages = await sql`
        SELECT id, full_name as "fullName", email, mobile, message, created_at as "createdAt" 
        FROM messages 
        ORDER BY created_at DESC
      `;
      res.json(messages);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', async (req, res) => {
    try {
      const { fullName, email, mobile, message } = req.body;
      const id = uuidv4();
      await sql`
        INSERT INTO messages (id, full_name, email, mobile, message) 
        VALUES (${id}, ${fullName}, ${email}, ${mobile}, ${message})
      `;
      
      const messages = await sql`
        SELECT id, full_name as "fullName", email, mobile, message, created_at as "createdAt" 
        FROM messages 
        WHERE id = ${id} LIMIT 1
      `;
      res.status(201).json(messages[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.delete('/api/leads/:id', isAdmin, async (req, res) => {
    try {
      await sql`DELETE FROM leads WHERE id = ${req.params.id}`;
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  });

  app.get('/api/stats', isAdmin, async (req, res) => {
    try {
      const totalLeadsRes = await sql`SELECT COUNT(*) as count FROM leads`;
      const totalCoursesRes = await sql`SELECT COUNT(*) as count FROM courses`;
      const totalHiringRes = await sql`SELECT COUNT(*) as count FROM hiring`;

      const totalLeads = parseInt(totalLeadsRes[0].count);
      const totalCourses = parseInt(totalCoursesRes[0].count);
      const totalHiring = parseInt(totalHiringRes[0].count);

      // Monthly leads for the last 6 months
      const monthlyLeads = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        
        const countRes = await sql`
          SELECT COUNT(*) as count 
          FROM leads 
          WHERE created_at >= ${startOfMonth} AND created_at <= ${endOfMonth}
        `;
        
        monthlyLeads.push({ name: monthName, leads: parseInt(countRes[0].count) });
      }

      res.json({
        totalLeads,
        totalCourses,
        totalHiring,
        monthlyLeads
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Hiring API
  app.get('/api/hiring', async (req, res) => {
    try {
      const posts = await sql`
        SELECT id, title, company, location, type, description, requirements, salary, created_at as "createdAt" 
        FROM hiring 
        ORDER BY created_at DESC
      `;
      res.json(posts);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch hiring posts' });
    }
  });

  app.post('/api/hiring', isAdmin, async (req, res) => {
    try {
      const { title, company, location, type, description, requirements, salary } = req.body;
      const id = uuidv4();
      await sql`
        INSERT INTO hiring (id, title, company, location, type, description, requirements, salary) 
        VALUES (${id}, ${title}, ${company}, ${location}, ${type}, ${description}, ${requirements}, ${salary})
      `;
      
      const posts = await sql`
        SELECT id, title, company, location, type, description, requirements, salary, created_at as "createdAt" 
        FROM hiring 
        WHERE id = ${id} LIMIT 1
      `;
      res.status(201).json(posts[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create hiring post' });
    }
  });

  app.put('/api/hiring/:id', isAdmin, async (req, res) => {
    try {
      const { title, company, location, type, description, requirements, salary } = req.body;
      await sql`
        UPDATE hiring 
        SET title = ${title}, company = ${company}, location = ${location}, type = ${type}, description = ${description}, requirements = ${requirements}, salary = ${salary} 
        WHERE id = ${req.params.id}
      `;
      
      const posts = await sql`
        SELECT id, title, company, location, type, description, requirements, salary, created_at as "createdAt" 
        FROM hiring 
        WHERE id = ${req.params.id} LIMIT 1
      `;
      res.json(posts[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update hiring post' });
    }
  });

  app.delete('/api/hiring/:id', isAdmin, async (req, res) => {
    try {
      await sql`DELETE FROM hiring WHERE id = ${req.params.id}`;
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete hiring post' });
    }
  });

  // AI Chat API
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('GEMINI_API_KEY is missing');
        return res.status(500).json({ error: 'AI Assistant is not configured. Please add GEMINI_API_KEY to environment variables.' });
      }

      // Fetch latest courses for system instruction context
      const courses = await sql`SELECT name, duration, price, description FROM courses`;
      const coursesContext = courses.map(c => `- ${c.name}: Duration ${c.duration}, Fee ${c.price}. ${c.description}`).join('\n');

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: `You are "Devansh", the official AI Academic Counselor for Devansh Edu-Tech Classes. 
          Your primary goal is to provide detailed information about our technical courses and guide prospective students toward the best career path.
          
          ### Institute Overview:
          - **Name**: Devansh Edu-Tech Classes
          - **Specialization**: Industry-aligned technical training, focusing on Full Stack Development, Data Science, and Software Testing.
          - **Core Value**: Providing practical, project-based learning to make students job-ready.
          - **Location**: Pune, Maharashtra, India.
          - **Contact for Enrollment**: +91 8669880738 (WhatsApp/Call).
          
          ### Available Programs & Details:
          ${coursesContext}
          
          ### Interaction Guidelines:
          1. **Tone**: Be professional, enthusiastic, and highly knowledgeable about tech careers.
          2. **Sales Approach**: Highlight the benefits of each course (e.g., career growth, salary potential, hands-on experience).
          3. **Course Guidance**: If a student is unsure, ask about their background (e.g., "Are you a beginner or looking to upskill?") and recommend a course like "Foundation using C++" for beginners.
          4. **Missing Info**: If a specific detail (like exact batch timings) isn't listed, invite them to contact our WhatsApp number (+91 8669880738) for a personal counseling session.
          5. **Formatting**: Use bold text for emphasis and bullet points for readability. Keep responses concise but information-rich.
          6. **Language**: Respond in the same language the user uses (Default to English).
          
          Always end by offering further assistance or inviting them to visit our center in Pune.`
        },
        history: history || [],
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error('AI Chat Error:', e);
      res.status(500).json({ error: 'Failed to get response from AI Assistant' });
    }
  });

  // Serve Vite or Static Files
  if (!isProd) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
