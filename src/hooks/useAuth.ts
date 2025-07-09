import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'admin' | 'manager' | 'analyst'
  company_id: string | null
  phone_number?: string | null
  whatsapp_verified?: boolean
}

interface Company {
  id: string
  name: string
  industry: string
  country?: string | null
  currency?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
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
          
          // Fetch company if user has one
          if (profile.company_id) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', profile.company_id)
              .single()
            
            setCompany(companyData)
          }
        }
      }
      
      setLoading(false)
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, userProfile, company, loading, isLoading, signOut }
}