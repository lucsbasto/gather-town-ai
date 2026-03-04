-- Create map_data table (must be created first since rooms references it)
CREATE TABLE map_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tileset_json JSONB,
  collision_layer JSONB,
  width INTEGER DEFAULT 25,
  height INTEGER DEFAULT 19,
  tile_size INTEGER DEFAULT 32,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  map_id UUID REFERENCES map_data(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  max_players INTEGER DEFAULT 20
);

-- Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  x INTEGER DEFAULT 400,
  y INTEGER DEFAULT 300,
  avatar_url TEXT,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Users can insert their own rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own rooms" ON rooms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own rooms" ON rooms FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for players
CREATE POLICY "Players are viewable by room members" ON players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own player" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own player" ON players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own player" ON players FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for map_data
CREATE POLICY "Map data is viewable by everyone" ON map_data FOR SELECT USING (true);
CREATE POLICY "Users can insert map data" ON map_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update map data" ON map_data FOR UPDATE USING (true);
CREATE POLICY "Users can delete map data" ON map_data FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_is_public ON rooms(is_public) WHERE is_public = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_map_data_updated_at BEFORE UPDATE ON map_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
