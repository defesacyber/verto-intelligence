import { z } from "zod";

/**
 * Environment variables validation schema
 * Ensures all required environment variables are present at startup
 */
const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),
});

/**
 * Validates environment variables and throws an error if any are missing or invalid
 * @throws {Error} If validation fails with detailed error messages
 */
export function validateEnv() {
    try {
        const env = {
            VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
            VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        };

        // Check if we are in a build/CI environment where env vars might not be present yet
        if (!env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
            console.warn("⚠️ Supabase environment variables are missing. The app will run in a limited mode or fail to connect.");
            return;
        }

        envSchema.parse(env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map((err) => `  - ${err.path.join(".")}: ${err.message}`).join("\n");
            
            console.error(
                `❌ Environment variables validation failed:\n\n${missingVars}\n\n` +
                `The application may crash or behave unexpectedly.`
            );
            // We do NOT throw here to avoid WSOD (White Screen of Death)
            // This allows the React app to mount and show a proper error UI if needed
        } else {
            console.error(error);
        }
    }
}

/**
 * Gets validated environment variables
 * @returns Validated environment variables object
 */
export function getEnv() {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

    if (!url || !key) {
        throw new Error("Missing required Supabase environment variables");
    }

    return {
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: key,
    };
}
