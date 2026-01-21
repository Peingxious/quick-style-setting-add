import { App, FileSystemAdapter, Notice } from 'obsidian';

export class SnippetManager {
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	async getSnippetsDir(): Promise<string> {
		return `${this.app.vault.configDir}/snippets`;
	}

	async ensureSnippetsDir() {
		const adapter = this.app.vault.adapter;
		const snippetsDir = await this.getSnippetsDir();
		if (!(await adapter.exists(snippetsDir))) {
			await adapter.mkdir(snippetsDir);
		}
	}

	async listSnippets(): Promise<string[]> {
		const adapter = this.app.vault.adapter;
		const snippetsDir = await this.getSnippetsDir();
		
		if (!(await adapter.exists(snippetsDir))) {
			return [];
		}

		const files = await adapter.list(snippetsDir);
		return files.files
			.filter(path => path.endsWith('.css'))
			.map(path => path.split('/').pop() || '');
	}

	async readSnippet(filename: string): Promise<string> {
		const adapter = this.app.vault.adapter;
		const snippetsDir = await this.getSnippetsDir();
		const path = `${snippetsDir}/${filename}`;
		if (await adapter.exists(path)) {
			return await adapter.read(path);
		}
		return '';
	}

	async writeSnippet(filename: string, content: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		const snippetsDir = await this.getSnippetsDir();
		await this.ensureSnippetsDir();
		const path = `${snippetsDir}/${filename}`;
		await adapter.write(path, content);
        // Reload snippets in Obsidian to apply changes immediately
        // @ts-ignore
        this.app.customCss?.requestLoadSnippets();
	}

	async deleteSnippet(filename: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		const snippetsDir = await this.getSnippetsDir();
		const path = `${snippetsDir}/${filename}`;
		if (await adapter.exists(path)) {
			await adapter.remove(path);
            // @ts-ignore
            this.app.customCss?.requestLoadSnippets();
		}
	}
    
    async renameSnippet(oldName: string, newName: string): Promise<void> {
        const adapter = this.app.vault.adapter;
        const snippetsDir = await this.getSnippetsDir();
        const oldPath = `${snippetsDir}/${oldName}`;
        const newPath = `${snippetsDir}/${newName}`;
        
        if (await adapter.exists(oldPath)) {
            await adapter.rename(oldPath, newPath);
             // @ts-ignore
            this.app.customCss?.requestLoadSnippets();
        }
    }
}
