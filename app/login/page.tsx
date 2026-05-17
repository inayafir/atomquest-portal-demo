'use client'

import { BackgroundMesh } from '@/components/BackgroundMesh'
import { Button } from '@/components/ui/Button'
import { Field, Input, Label } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Atom, ArrowRight, Lock, Mail, Sparkles, Target, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'

const features = [
  { icon: Target, text: 'SMART goal alignment across teams' },
  { icon: TrendingUp, text: 'Quarterly check-ins with live scoring' },
  { icon: Users, text: 'Manager approval workflows built-in' },
]

const demoAccounts = [
  { email: 'priya@demo.com', role: 'Employee' },
  { email: 'raj@demo.com', role: 'Manager' },
  { email: 'admin@demo.com', role: 'Admin' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    window.location.href = '/dashboard'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex min-h-screen"
    >
      <BackgroundMesh />

      {/* Hero panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-cyan/5" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan glow-accent"
          >
            <Atom className="h-7 w-7 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">AtomQuest</span>
            <br />
            <span className="gradient-accent">Portal</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/50 leading-relaxed">
            Turn ambitious goals into measurable quests. Align teams, track progress, and celebrate wins — every quarter.
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 space-y-4"
        >
          {features.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 text-sm text-white/60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-accent-bright">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-md"
        >
          <motion.div
            className="mb-8 flex items-center gap-3 lg:hidden"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <motion.div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan">
              <Atom className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="font-semibold text-white">AtomQuest Portal</p>
              <p className="text-xs text-white/40">Sign in to continue</p>
            </div>
          </motion.div>

          {/* FIX: was a plain <div> closed as </motion.div> */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-white/45">Sign in to your account</p>
          </div>

          <motion.div className="glass-strong rounded-2xl p-8 space-y-5">
            <Field>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@company.com"
                />
              </div>
            </Field>

            <Field>
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </Field>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-sm text-danger"
              >
                {error}
              </motion.p>
            )}

            <Button
              onClick={handleLogin}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/35">
              <Sparkles className="h-3.5 w-3.5 text-cyan" />
              Demo accounts
            </div>
            <div className="space-y-2">
              {demoAccounts.map(({ email: demoEmail, role }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => {
                    setEmail(demoEmail)
                    setPassword('Demo@1234')
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04]"
                >
                  <span className="font-mono text-white/70">{demoEmail}</span>
                  <span className="text-xs text-white/35">{role}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/25">
              Password: <span className="font-mono text-white/40">Demo@1234</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}