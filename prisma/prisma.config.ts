// Prisma 7 datasource configuration
// Move connection URLs and migrate-related config here.
// Set `DATABASE_URL` in your environment (e.g., .env) before running migrations or generating the client.

// NOTE: Prisma's config API changed in v7. This file provides a minimal default
// configuration that reads the database URL from the environment. Depending on
// your Prisma CLI version and project setup you may need to adapt this file.

export default {
    datasources: {
        db: {
            provider: 'postgresql',
            // Provide your connection URL via environment variable
            // For example in development, set DATABASE_URL in a .env file
            url: process.env.DATABASE_URL,
        },
    },
}
