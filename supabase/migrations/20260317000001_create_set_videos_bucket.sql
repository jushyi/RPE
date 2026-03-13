-- Create public bucket for set videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('set-videos', 'set-videos', true);

-- RLS: Only authenticated users can upload to their own folder
CREATE POLICY "Users can upload own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: Anyone can read (public bucket)
CREATE POLICY "Public read access for set videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'set-videos');

-- RLS: Users can delete own videos
CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: Users can update (replace) own videos
CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
