-- Create table for storing student QR codes
CREATE TABLE public.student_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  qr_data TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id) -- Ensure one QR code per student ID
);

-- Enable Row Level Security
ALTER TABLE public.student_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for QR codes access
CREATE POLICY "Anyone can view QR codes" 
ON public.student_qr_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create QR codes" 
ON public.student_qr_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update QR codes" 
ON public.student_qr_codes 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete QR codes" 
ON public.student_qr_codes 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_qr_codes_updated_at
BEFORE UPDATE ON public.student_qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();