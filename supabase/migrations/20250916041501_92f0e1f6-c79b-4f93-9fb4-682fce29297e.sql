-- Create sessions table for storing class session information
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  college TEXT NOT NULL,
  instructor TEXT NOT NULL,
  section TEXT NOT NULL,
  course TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table for storing individual scan records
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  scan_time TIME WITH TIME ZONE NOT NULL DEFAULT now(),
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions table (public access for this attendance app)
CREATE POLICY "Anyone can view sessions" 
ON public.sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.sessions 
FOR UPDATE 
USING (true);

-- Create policies for attendance_records table (public access)
CREATE POLICY "Anyone can view attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_records_scan_date ON public.attendance_records(scan_date);
CREATE INDEX idx_sessions_session_date ON public.sessions(session_date);