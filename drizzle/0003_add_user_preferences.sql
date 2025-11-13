CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_theme" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_unique" ON "user_preferences" ("user_id");

