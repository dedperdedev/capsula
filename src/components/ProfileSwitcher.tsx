/**
 * Profile Switcher Component
 * Allows switching between profiles and creating new ones
 */

import { useState } from 'react';
import { Plus, Check, Edit2 } from 'lucide-react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { loadAppState, saveAppState, appendEvent, type Profile } from '../data/storage';
import { toast } from './shared/Toast';
import { useI18n } from '../hooks/useI18n';

interface ProfileSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileChange: () => void;
}

const PROFILE_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function ProfileSwitcher({ isOpen, onClose, onProfileChange }: ProfileSwitcherProps) {
  const { locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState(PROFILE_COLORS[0]);

  const state = loadAppState();
  const profiles = state.profiles;
  const activeProfileId = state.activeProfileId;

  const handleSelectProfile = (profileId: string) => {
    if (profileId === activeProfileId) {
      onClose();
      return;
    }

    state.activeProfileId = profileId;
    saveAppState(state);

    appendEvent({
      profileId,
      ts: new Date().toISOString(),
      type: 'PROFILE_SWITCHED',
      metadata: { fromProfileId: activeProfileId },
    });

    toast.success(locale === 'ru' ? 'Профиль переключен' : 'Profile switched');
    onProfileChange();
    onClose();
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      toast.error(locale === 'ru' ? 'Введите имя профиля' : 'Enter profile name');
      return;
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: newProfileName.trim(),
      color: newProfileColor,
      createdAt: new Date().toISOString(),
    };

    state.profiles.push(newProfile);
    saveAppState(state);

    appendEvent({
      profileId: newProfile.id,
      ts: new Date().toISOString(),
      type: 'PROFILE_CREATED',
      metadata: { name: newProfile.name },
    });

    toast.success(locale === 'ru' ? 'Профиль создан' : 'Profile created');
    setNewProfileName('');
    setIsEditing(false);
  };

  const handleUpdateProfile = () => {
    if (!editingProfile || !newProfileName.trim()) {
      toast.error(locale === 'ru' ? 'Введите имя профиля' : 'Enter profile name');
      return;
    }

    const index = state.profiles.findIndex(p => p.id === editingProfile.id);
    if (index === -1) return;

    state.profiles[index] = {
      ...state.profiles[index],
      name: newProfileName.trim(),
      color: newProfileColor,
    };
    saveAppState(state);

    appendEvent({
      profileId: editingProfile.id,
      ts: new Date().toISOString(),
      type: 'PROFILE_UPDATED',
      metadata: { name: newProfileName.trim() },
    });

    toast.success(locale === 'ru' ? 'Профиль обновлен' : 'Profile updated');
    setEditingProfile(null);
    setNewProfileName('');
    setIsEditing(false);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      toast.error(locale === 'ru' ? 'Нельзя удалить единственный профиль' : 'Cannot delete the only profile');
      return;
    }

    if (!confirm(locale === 'ru' ? 'Удалить профиль и все его данные?' : 'Delete profile and all its data?')) {
      return;
    }

    state.profiles = state.profiles.filter(p => p.id !== profileId);
    
    // If deleted profile was active, switch to first available
    if (state.activeProfileId === profileId) {
      state.activeProfileId = state.profiles[0].id;
    }

    // Remove profile's data
    state.schedules = state.schedules.filter(s => s.profileId !== profileId);
    state.inventory = state.inventory.filter(i => i.profileId !== profileId);
    state.events = state.events.filter(e => e.profileId !== profileId);

    saveAppState(state);
    toast.success(locale === 'ru' ? 'Профиль удален' : 'Profile deleted');
    onProfileChange();
  };

  const startEditing = (profile?: Profile) => {
    if (profile) {
      setEditingProfile(profile);
      setNewProfileName(profile.name);
      setNewProfileColor(profile.color || PROFILE_COLORS[0]);
    } else {
      setEditingProfile(null);
      setNewProfileName('');
      setNewProfileColor(PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]);
    }
    setIsEditing(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'ru' ? 'Профили' : 'Profiles'}
      size="md"
    >
      <div className="space-y-4">
        {!isEditing ? (
          <>
            {/* Profile List */}
            <div className="space-y-2">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`
                    flex items-center justify-between p-3 rounded-[18px] border transition-all cursor-pointer
                    ${profile.id === activeProfileId 
                      ? 'border-[var(--acc)] bg-[var(--acc)]/10' 
                      : 'border-[var(--stroke)] hover:bg-[var(--surface2)]'}
                  `}
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: profile.color || PROFILE_COLORS[0] }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text)]">{profile.name}</p>
                      {profile.id === activeProfileId && (
                        <p className="text-xs text-[var(--acc)]">
                          {locale === 'ru' ? 'Активный' : 'Active'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.id === activeProfileId && (
                      <Check size={20} className="text-[var(--acc)]" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(profile);
                      }}
                      className="p-2 hover:bg-[var(--stroke)] rounded-full transition-colors"
                    >
                      <Edit2 size={16} className="text-[var(--muted2)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Profile Button */}
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={() => startEditing()}
            >
              <Plus size={18} className="mr-2" />
              {locale === 'ru' ? 'Добавить профиль' : 'Add Profile'}
            </Button>
          </>
        ) : (
          /* Edit/Create Form */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {locale === 'ru' ? 'Имя профиля' : 'Profile Name'}
              </label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder={locale === 'ru' ? 'Например: Мама, Папа...' : 'E.g.: Mom, Dad...'}
                className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {locale === 'ru' ? 'Цвет' : 'Color'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROFILE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewProfileColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newProfileColor === color ? 'ring-2 ring-offset-2 ring-[var(--acc)]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => {
                  setIsEditing(false);
                  setEditingProfile(null);
                  setNewProfileName('');
                }}
              >
                {locale === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
              >
                {editingProfile 
                  ? (locale === 'ru' ? 'Сохранить' : 'Save')
                  : (locale === 'ru' ? 'Создать' : 'Create')}
              </Button>
            </div>

            {editingProfile && profiles.length > 1 && (
              <Button 
                variant="danger" 
                fullWidth 
                onClick={() => {
                  handleDeleteProfile(editingProfile.id);
                  setIsEditing(false);
                  setEditingProfile(null);
                }}
              >
                {locale === 'ru' ? 'Удалить профиль' : 'Delete Profile'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

