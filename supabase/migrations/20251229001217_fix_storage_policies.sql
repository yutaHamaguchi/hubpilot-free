-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- 新しいポリシーを作成
CREATE POLICY "Allow public uploads" ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id IN ('hubpilot-static', 'hubpilot-images'));

CREATE POLICY "Allow public access" ON storage.objects 
  FOR SELECT 
  USING (bucket_id IN ('hubpilot-static', 'hubpilot-images'));

CREATE POLICY "Allow public updates" ON storage.objects 
  FOR UPDATE 
  USING (bucket_id IN ('hubpilot-static', 'hubpilot-images'));

CREATE POLICY "Allow public deletes" ON storage.objects 
  FOR DELETE 
  USING (bucket_id IN ('hubpilot-static', 'hubpilot-images'));;
