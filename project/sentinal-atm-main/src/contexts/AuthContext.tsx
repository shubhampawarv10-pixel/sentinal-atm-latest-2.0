import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../lib/types'

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    let listener: { subscription: { unsubscribe: () => void } } | null = null
    try {
      const result = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess)
        if (sess) {
          loadProfile(sess.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      })
      listener = result.data
    } catch {
      setLoading(false)
    }

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (data) {
        setProfile(data as Profile)
      } else {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: userData.user.email || '',
              full_name: (userData.user.user_metadata?.full_name as string) || 'Officer',
              role: 'analyst',
            })
            .select()
            .single()
          if (newProfile) setProfile(newProfile as Profile)
        }
      }
    } catch (e) {
      console.error('Profile load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error?.message || null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  async function updateRole(role: UserRole) {
    if (!profile) return
    const { data } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profile.id)
      .select()
      .single()
    if (data) setProfile(data as Profile)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
