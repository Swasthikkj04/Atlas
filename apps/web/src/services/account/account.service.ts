import { apiClient } from '../api/client';
import type {
  UserPreferences,
  UpdatePreferencesPayload,
} from '../../features/settings/contracts/preferences.contract';
import type {
  AccountOverview,
  DeactivateAccountPayload,
  DeleteAccountPayload,
} from '../../features/settings/contracts/account-lifecycle.contract';

export class AccountService {
  async getAccountOverview(): Promise<AccountOverview> {
    return apiClient.get<AccountOverview>('/api/v1/account');
  }

  async deactivateAccount(
    payload: DeactivateAccountPayload
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }, DeactivateAccountPayload>(
      '/api/v1/account/deactivate',
      payload
    );
  }

  async deleteAccount(
    payload: DeleteAccountPayload
  ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }, DeleteAccountPayload>(
      '/api/v1/account',
      payload
    );
  }

  async getPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>('/api/v1/account/preferences');
  }

  async updatePreferences(
    payload: UpdatePreferencesPayload
  ): Promise<UserPreferences> {
    return apiClient.patch<UserPreferences, UpdatePreferencesPayload>(
      '/api/v1/account/preferences',
      payload
    );
  }
}

export const accountService = new AccountService();
