-- ストレージバケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hubpilot-static', 'hubpilot-static', true, 52428800, ARRAY['text/html', 'text/css', 'application/javascript', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']),
  ('hubpilot-images', 'hubpilot-images', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;;
