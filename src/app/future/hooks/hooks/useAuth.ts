import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'analyst';
  company_id: string;
  phone_number: string | null;
}

interface Company {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  industry?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
          
          // Fetch company data
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()
          
          setCompany(companyData)
        }
      }
      
      setLoading(false)
      setIsLoading(false)
    }

    loadUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Reload profile and company data when auth state changes
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
          
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()
          
          setCompany(companyData)
        }
      } else {
        setUserProfile(null)
        setCompany(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setCompany(null)
  }

  return { user, userProfile, company, loading, isLoading, signOut }
}