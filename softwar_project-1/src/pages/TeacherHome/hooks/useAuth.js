import { useEffect, useState } from 'react';
import { authManager } from '../lib/auth';

export function useAuth() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return authManager.subscribe(() => {
      forceUpdate({});
    });
  }, []);

  return {
    user: authManager.getCurrentUser(),
    isAuthenticated: authManager.isAuthenticated(),
    login: authManager.login.bind(authManager),
    register: authManager.register.bind(authManager),
    logout: authManager.logout.bind(authManager),
    updateProfile: authManager.updateProfile.bind(authManager),
    changePassword: authManager.changePassword.bind(authManager),
    deleteAccount: authManager.deleteAccount.bind(authManager),
  };
}
