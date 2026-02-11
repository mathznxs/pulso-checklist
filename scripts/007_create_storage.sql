-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "task_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read any task image
CREATE POLICY "task_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'task-images');

-- Allow public read access for task images
CREATE POLICY "task_images_public_select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'task-images');
