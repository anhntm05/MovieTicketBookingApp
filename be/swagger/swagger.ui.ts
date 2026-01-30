// Swagger UI configuration for modern dark theme with high contrast support
import fs from 'fs';
import path from 'path';

// Load dark theme CSS
const darkThemeCss = fs.readFileSync(path.join(__dirname, 'styles', 'dark-theme.css'), 'utf8');

/**
 * Swagger UI configuration with professional dark theme
 * Features:
 * - Modern dark theme matching Stripe/GitHub aesthetic
 * - High contrast mode for accessibility (WCAG AAA compliant)
 * - Theme toggle functionality with localStorage persistence
 * - Professional color scheme with proper HTTP method highlighting
 * - Smooth animations and transitions
 * - Fully responsive design
 */
export const swaggerUiOptions = {
  customCss: darkThemeCss,
  customSiteTitle: '🎬 Movie Booking API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    displayOperationId: false,
    docExpansion: 'list',
    filter: true,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
};

/**
 * Swagger HTML configuration for custom layout
 * Includes theme toggle buttons and custom header
 */
export const getSwaggerHtml = (specUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="theme-color" content="#0d1117">
      <meta name="description" content="Movie Booking API - Professional API Documentation">
      <title>🎬 Movie Booking API Documentation</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap">
      <link rel="stylesheet" href="/api-docs/swagger-ui.css">
      <style>${darkThemeCss}</style>
      <style>
        .theme-toggle-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          gap: 10px;
        }
        .theme-toggle-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .theme-toggle-btn:hover {
          background: var(--bg-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .theme-toggle-btn.active {
          background: var(--accent-blue);
          color: #000;
          border-color: var(--accent-blue);
          box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4);
        }
        .custom-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .custom-header h1 {
          color: var(--text-primary);
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .custom-header p {
          color: var(--text-secondary);
          font-size: 1rem;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="theme-toggle-container">
        <button class="theme-toggle-btn active" id="dark-theme-btn">🌙 Dark</button>
        <button class="theme-toggle-btn" id="high-contrast-btn">⚡ High Contrast</button>
      </div>
      <div class="custom-header">
        <h1><span>🎬</span>Movie Booking API</h1>
        <p>Professional API documentation for the Movie Ticket Booking Platform</p>
      </div>
      <div id="swagger-ui"></div>
      <script src="/api-docs/swagger-ui-bundle.js"></script>
      <script src="/api-docs/swagger-ui-standalone-preset.js"></script>
      <script>
        const darkThemeBtn = document.getElementById('dark-theme-btn');
        const highContrastBtn = document.getElementById('high-contrast-btn');
        const root = document.documentElement;

        const themes = {
          dark: {
            '--bg-primary': '#0d1117',
            '--bg-secondary': '#161b22',
            '--bg-tertiary': '#21262d',
            '--bg-hover': '#30363d',
            '--text-primary': '#e6edf3',
            '--text-secondary': '#8b949e',
            '--text-muted': '#6e7681',
            '--border-primary': '#30363d',
            '--border-secondary': '#21262d',
            '--accent-blue': '#58a6ff',
            '--accent-green': '#3fb950',
            '--accent-yellow': '#d29922',
            '--accent-red': '#f85149',
            '--accent-purple': '#bc8cff',
          },
          'high-contrast': {
            '--bg-primary': '#000000',
            '--bg-secondary': '#0a0a0a',
            '--bg-tertiary': '#1a1a1a',
            '--bg-hover': '#2a2a2a',
            '--text-primary': '#ffffff',
            '--text-secondary': '#d0d0d0',
            '--text-muted': '#a0a0a0',
            '--border-primary': '#404040',
            '--border-secondary': '#2a2a2a',
            '--accent-blue': '#7dbeff',
            '--accent-green': '#5fd96a',
            '--accent-yellow': '#ffcc44',
            '--accent-red': '#ff6b6b',
            '--accent-purple': '#d4a6ff',
          },
        };

        const savedTheme = localStorage.getItem('swagger-api-theme') || 'dark';
        applyTheme(savedTheme);

        darkThemeBtn.addEventListener('click', () => {
          applyTheme('dark');
          localStorage.setItem('swagger-api-theme', 'dark');
        });

        highContrastBtn.addEventListener('click', () => {
          applyTheme('high-contrast');
          localStorage.setItem('swagger-api-theme', 'high-contrast');
        });

        function applyTheme(themeName) {
          darkThemeBtn.classList.remove('active');
          highContrastBtn.classList.remove('active');

          const themeColors = themes[themeName];
          for (const [key, value] of Object.entries(themeColors)) {
            root.style.setProperty(key, value);
          }

          if (themeName === 'high-contrast') {
            root.classList.add('high-contrast');
            highContrastBtn.classList.add('active');
          } else {
            root.classList.remove('high-contrast');
            darkThemeBtn.classList.add('active');
          }
        }

        window.onload = function() {
          // Build presets dynamically to avoid errors when the standalone preset
          // isn't loaded (e.g. network issues or blocked CDN). Fall back to
          // BaseLayout if StandaloneLayout is not defined.
          (function initSwagger() {
            try {
              const presets = [];
              if (window.SwaggerUIBundle && SwaggerUIBundle.presets && SwaggerUIBundle.presets.apis) {
                presets.push(SwaggerUIBundle.presets.apis);
              }
              if (typeof SwaggerUIStandalonePreset !== 'undefined') {
                presets.push(SwaggerUIStandalonePreset);
              }

              const layoutName = (typeof SwaggerUIStandalonePreset !== 'undefined') ? 'StandaloneLayout' : 'BaseLayout';

              window.ui = SwaggerUIBundle({
                url: "${specUrl}",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: presets,
                plugins: [SwaggerUIBundle.plugins && SwaggerUIBundle.plugins.DownloadUrl].filter(Boolean),
                layout: layoutName,
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: 'list',
                filter: true,
                tryItOutEnabled: true,
                syntaxHighlight: {
                  activate: true,
                  theme: 'monokai',
                },
              });
            } catch (err) {
              // If initialization fails, log and show a simple error message in the UI
              console.error('Failed to initialize Swagger UI', err);
              const el = document.getElementById('swagger-ui');
              if (el) {
                el.innerHTML = '<div style="padding:20px;color:#ff6b6b;background:#111;border-radius:8px">Failed to load Swagger UI. Check console for details.</div>';
              }
            }
          })();
        };
      </script>
    </body>
    </html>
  `;
};

