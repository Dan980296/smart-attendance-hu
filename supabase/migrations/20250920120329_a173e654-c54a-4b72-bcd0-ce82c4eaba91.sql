-- Add section field to student_qr_codes table to track which section each student belongs to
ALTER TABLE public.student_qr_codes ADD COLUMN section TEXT;

-- Create index for better performance when querying by section
CREATE INDEX idx_student_qr_codes_section ON public.student_qr_codes(section);

-- Update existing records to have a default section (can be updated later)
UPDATE public.student_qr_codes SET section = 'Default' WHERE section IS NULL;