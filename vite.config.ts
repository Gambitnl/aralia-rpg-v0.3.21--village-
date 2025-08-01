import path from 'path';
import { defineConfig, loadEnv, createLogger } from 'vite';

const logger = createLogger();
const loggerWarn = logger.warn;

logger.warn = (msg, options) => {
    if (msg.includes('node_modules/framer-motion')) return;
    loggerWarn(msg, options);
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      customLogger: logger,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
