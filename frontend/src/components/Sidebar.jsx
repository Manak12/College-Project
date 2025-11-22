// import React from 'react';
// import { motion } from 'motion/react';
// import { 
//   BarChart3, 
//   Video, 
//   Settings, 
//   Users, 
//   Calendar,
//   MessageCircle,
//   User
// } from 'lucide-react';

// export function Sidebar({ activeItem, onItemClick, isLiveSession = false }) {
//   const menuItems = [
//     { id: 'dashboard', icon: BarChart3, label: 'Dashboard' }
//   ];

//   return (
//     <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6">
//       {/* Logo */}
//       <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-8">
//         <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
//           <div className="w-3 h-3 bg-primary rounded-full"></div>
//         </div>
//       </div>

//       {/* Menu Items */}
//       <div className="flex flex-col gap-4 flex-1">
//         {menuItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = activeItem === item.id;
          
//           return (
//             <motion.button
//               key={item.id}
//               onClick={() => {
//                 if (!isLiveSession) {
//                   onItemClick(item.id);
//                 }
//               }}
//               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative ${
//                 isActive 
//                   ? 'bg-primary text-white' 
//                   : isLiveSession 
//                     ? 'text-muted-foreground cursor-not-allowed opacity-50' 
//                     : 'text-muted-foreground hover:bg-muted hover:text-white'
//               }`}
//               whileHover={{ scale: isLiveSession ? 1 : 1.05 }}
//               whileTap={{ scale: isLiveSession ? 1 : 0.95 }}
//               style={{ cursor: isLiveSession ? 'not-allowed' : 'pointer' }}
//               title={isLiveSession ? "Cannot navigate during live session" : item.label}
//             >
//               <Icon className="w-5 h-5" />
//               {isActive && (
//                 <motion.div
//                   className="absolute -right-4 w-1 h-8 bg-primary rounded-l-full"
//                   layoutId="activeIndicator"
//                 />
//               )}
//             </motion.button>
//           );
//         })}
//       </div>

//       {/* User Profile */}
//       <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
//         <User className="w-5 h-5 text-muted-foreground" />
//       </div>
//     </div>
//   );
// }

import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Video, 
  Settings, 
  Users, 
  Calendar,
  MessageCircle,
  User
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useEffect } from 'react';
import { useRef } from "react";

export function Sidebar({ activeItem, onItemClick, onBack }) {
  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' }
  ];
  const [profileOpen, setProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', role: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new1: '', new2: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const formRef = useRef();

  const resetPwState = () => {
    setPwForm({ current: '', new1: '', new2: '' });
    setPwError(''); setPwSuccess(''); setPwLoading(false); setChangingPw(false);
  };

  useEffect(() => { resetPwState(); }, [profileOpen === false]);

  async function handlePwSubmit(e) {
    e.preventDefault(); setPwError(''); setPwSuccess(''); setPwLoading(true);
    if (!pwForm.current || !pwForm.new1 || !pwForm.new2) {
      setPwError('All fields are required.'); setPwLoading(false); return;
    }
    if (pwForm.new1 !== pwForm.new2) {
      setPwError('New passwords do not match.'); setPwLoading(false); return;
    }
    if (pwForm.new1.length < 6) {
      setPwError('New password must be at least 6 characters.'); setPwLoading(false); return;
    }
    try {
      // Get token
      const token = localStorage.getItem('authToken') || document.cookie.split('; ').find(c=>c.startsWith('authToken='))?.split('=')[1];
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.new1
        })
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        setPwError(resJson.message || 'Failed to change password.'); setPwLoading(false); return;
      }
      setPwSuccess('Password updated!'); setPwLoading(false);
      setPwForm({ current: '', new1: '', new2: '' });
    } catch (e) {
      setPwError('Error changing password.'); setPwLoading(false);
    }
  }

  useEffect(() => {
    let name = localStorage.getItem('userName') || '';
    let email = localStorage.getItem('userEmail') || '';
    let role = localStorage.getItem('userRole') || '';
    // fallback to cookie
    if (!name || !email || !role) {
      const getCookie = (cname) => {
        const match = document.cookie.match(new RegExp('(^| )' + cname + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
      };
      name = name || getCookie('userName');
      email = email || getCookie('userEmail');
      role = role || getCookie('userRole');
    }
    setUserInfo({ name, email, role });
  }, []);

  const userInitials = userInfo.name
    ? userInfo.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6">
      {/* Logo */}
      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-8">
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const handleClick = item.id === 'dashboard' && typeof onBack === 'function'
            ? () => {
                onItemClick(item.id);
                onBack();
              }
            : () => onItemClick(item.id);
          return (
            <motion.button
              key={item.id}
              onClick={handleClick}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-muted-foreground hover:bg-muted hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <motion.div
                  className="absolute -right-4 w-1 h-8 bg-primary rounded-l-full"
                  layoutId="activeIndicator"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* User Profile - clickable, shows modal with info */}
      <button
        onClick={() => setProfileOpen(true)}
        title="My Profile"
        className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-0 hover:ring-2 ring-primary focus:outline-none transition"
        style={{ cursor: 'pointer' }}
      >
        <span className="text-xl font-bold text-primary">
          {userInitials}
        </span>
      </button>
      <Dialog open={profileOpen} onOpenChange={v => { setProfileOpen(v); if (!v) resetPwState(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            <span className="w-20 h-20 rounded-full bg-primary text-white text-4xl font-bold flex items-center justify-center mb-2">
              {userInitials}
            </span>
            <div className="text-center">
              <div className="font-semibold text-lg">{userInfo.name || 'User'}</div>
              {userInfo.email && <div className="text-muted-foreground text-sm mb-1">{userInfo.email}</div>}
              {userInfo.role && <div className="text-primary text-xs font-medium">{userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}</div>}
            </div>

            {/* Change Password Section */}
            <div className="w-full mt-4">
              <button className="underline text-xs text-primary mb-2" onClick={() => setChangingPw(v=>!v)}>
                {changingPw ? 'Cancel' : 'Change Password'}
              </button>
              {changingPw && (
                <form onSubmit={handlePwSubmit} ref={formRef} className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                  <input
                    type="password"
                    className="border px-3 py-1 rounded bg-background"
                    placeholder="Current password"
                    autoComplete="off"
                    value={pwForm.current}
                    onChange={e => setPwForm(form => ({ ...form, current: e.target.value }))}
                    required
                  />
                  <input
                    type="password"
                    className="border px-3 py-1 rounded bg-background"
                    placeholder="New password"
                    autoComplete="new-password"
                    value={pwForm.new1}
                    onChange={e => setPwForm(form => ({ ...form, new1: e.target.value }))}
                    required
                  />
                  <input
                    type="password"
                    className="border px-3 py-1 rounded bg-background"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={pwForm.new2}
                    onChange={e => setPwForm(form => ({ ...form, new2: e.target.value }))}
                    required
                  />
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="bg-primary text-white rounded py-2 mt-2 disabled:opacity-60"
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  {pwError && <div className="text-red-600 text-xs font-medium pt-1">{pwError}</div>}
                  {pwSuccess && <div className="text-green-700 text-xs font-medium pt-1">{pwSuccess}</div>}
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}