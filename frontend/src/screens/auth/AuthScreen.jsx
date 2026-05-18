// Stitched — Auth modal (sign up / sign in).

import { useState } from 'react';

import { Button, Eyebrow } from '../../components/atoms';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/primitives';
import { COLORS } from '../../theme/tokens';

export function AuthScreen({ onAuth, onClose, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode); // signup | signin
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (mode === 'signup' && !trimmedName) {
      setError('Enter your display name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSaving(true);
    try {
      const result = await onAuth({ mode, displayName: trimmedName, email: trimmedEmail, password });
      if (result?.confirmationRequired) {
        setSuccess(result.message || 'Account created. Check your email to confirm before signing in.');
        switchMode('signin');
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Unable to authenticate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal width={480} padding={40} onClose={onClose}>
      <Eyebrow>STITCHED · {mode === 'signup' ? 'NEW COLLECTOR' : 'WELCOME BACK'}</Eyebrow>
      <h1 style={{
        fontFamily: "'Geist', sans-serif", fontSize: 34, fontWeight: 500,
        letterSpacing: '-0.025em', margin: '14px 0 8px', color: COLORS.ink, lineHeight: 1.05,
      }}>{mode === 'signup' ? 'Create your account' : 'Sign in'}</h1>
      <p style={{ fontSize: 14, color: COLORS.inkMuted, margin: '0 0 28px', lineHeight: 1.5 }}>
        {mode === 'signup'
          ? 'Track your collection, comps, and player index in one place.'
          : 'Sign in to continue to your collection.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' && (
          <Input label="DISPLAY NAME" placeholder="Your name" value={displayName} onChange={setDisplayName}/>
        )}
        <Input label="EMAIL" placeholder="you@example.com" type="email" value={email} onChange={setEmail}/>
        <Input label="PASSWORD" placeholder="••••••••••" type="password" value={password} onChange={setPassword}/>
        {mode === 'signup' && (
          <div style={{ fontSize: 12, color: COLORS.inkMuted, lineHeight: 1.5, marginTop: 4 }}>
            By creating an account you agree to our community standards. Value estimates are not appraisals.
          </div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: COLORS.clay, lineHeight: 1.45 }} role="alert">
            {error}
          </div>
        )}
        {success && (
          <div style={{ fontSize: 13, color: COLORS.fieldMid, lineHeight: 1.45 }} role="status">
            {success}
          </div>
        )}
        <Button variant="primary" size="lg" full style={{ marginTop: 6, opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto' }}>
          {saving ? 'Saving…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
        </Button>
      </form>

      <div style={{ marginTop: 24, fontSize: 13, color: COLORS.inkMuted }}>
        {mode === 'signup' ? 'Already have an account?' : 'New to Stitched?'}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); switchMode(mode === 'signup' ? 'signin' : 'signup'); }} style={{ color: COLORS.pin, textDecoration: 'underline', fontWeight: 500 }}>
          {mode === 'signup' ? 'Sign in' : 'Create one'}
        </a>
      </div>
    </Modal>
  );
}
