/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubSyncConfig {
  token?: string;
  gistId?: string;
  repoOwner?: string;
  repoName?: string;
  lastSyncTime?: string;
}

const STORAGE_KEY_GITHUB_CFG = 'quantum_sparks_github_sync_cfg_v1';

export class GitHubCloudSync {
  public static getConfig(): GitHubSyncConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GITHUB_CFG);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public static saveConfig(cfg: GitHubSyncConfig): void {
    localStorage.setItem(STORAGE_KEY_GITHUB_CFG, JSON.stringify(cfg));
  }

  /**
   * Сохраняет JSON базы данных игроков в GitHub Gist
   */
  public static async saveDatabaseToGist(
    jsonData: string,
    token: string,
    existingGistId?: string
  ): Promise<{ success: boolean; gistId?: string; error?: string; htmlUrl?: string }> {
    try {
      const isUpdate = !!existingGistId;
      const url = isUpdate
        ? `https://api.github.com/gists/${existingGistId}`
        : 'https://api.github.com/gists';

      const method = isUpdate ? 'PATCH' : 'POST';

      const body = {
        description: 'Quantum Sparks: Tactical CCG - Cloud Player Database Backup',
        public: false,
        files: {
          'quantum_sparks_player_db.json': {
            content: jsonData,
          },
        },
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Ошибка GitHub API (${response.status}): ${errJson.message || response.statusText}`,
        };
      }

      const resData = await response.json();
      const gistId = resData.id;

      this.saveConfig({
        ...this.getConfig(),
        token,
        gistId,
        lastSyncTime: new Date().toISOString(),
      });

      return {
        success: true,
        gistId,
        htmlUrl: resData.html_url,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка сети';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Загружает JSON базы данных игроков из GitHub Gist
   */
  public static async loadDatabaseFromGist(
    gistId: string,
    token?: string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (token?.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const response = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Gist не найден (${response.status})`,
        };
      }

      const data = await response.json();
      const fileObj = data.files?.['quantum_sparks_player_db.json'] || Object.values(data.files || {})[0] as { content?: string } | undefined;

      if (!fileObj || !fileObj.content) {
        return {
          success: false,
          error: 'В указанном Gist не найден файл базы данных',
        };
      }

      return {
        success: true,
        data: fileObj.content,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка соединения с GitHub';
      return {
        success: false,
        error: message,
      };
    }
  }
}
