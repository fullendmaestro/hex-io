-- =====================================================
-- Supabase Database Schema Setup
-- =====================================================
-- This script sets up the database schema required for your
-- application including users table, RLS policies,
-- and automatic user profile creation.
--
-- Instructions:
-- 1. Copy this entire script
-- 2. Go to your Supabase dashboard > SQL Editor
-- 3. Paste and run this script
-- 4. Verify the setup by checking the Tables section
-- =====================================================

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================

-- Create users table with all required columns for the application
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before any update
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for server operations)
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- =====================================================
-- 6. AUTOMATIC USER PROFILE CREATION
-- =====================================================

-- Function to automatically create user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, just return NEW
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
