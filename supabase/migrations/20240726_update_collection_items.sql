
-- Add additional columns to collection_items table to match our CollectionItem type

ALTER TABLE public.collection_items
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS year_produced TEXT,
ADD COLUMN IF NOT EXISTS edition TEXT,
ADD COLUMN IF NOT EXISTS model_number TEXT,
ADD COLUMN IF NOT EXISTS unique_identifiers TEXT,
ADD COLUMN IF NOT EXISTS flaws TEXT,
ADD COLUMN IF NOT EXISTS completeness TEXT,
ADD COLUMN IF NOT EXISTS acquisition_source TEXT,
ADD COLUMN IF NOT EXISTS previous_owners TEXT,
ADD COLUMN IF NOT EXISTS documentation TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS rarity TEXT,
ADD COLUMN IF NOT EXISTS price_estimate JSONB DEFAULT '{"low": 0, "average": 0, "high": 0, "marketValue": 0}'::JSONB;

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS collection_items_user_id_idx ON public.collection_items(user_id);
