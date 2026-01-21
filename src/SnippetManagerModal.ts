import { App, Modal, Setting, Notice } from 'obsidian';
import { SnippetManager } from './SnippetManager';
import { SnippetEditorModal } from './SnippetEditorModal';
import QuickStyleSettingsPlugin from '../main';

export class SnippetManagerModal extends Modal {
	plugin: QuickStyleSettingsPlugin;
	snippetManager: SnippetManager;
	
	constructor(app: App, plugin: QuickStyleSettingsPlugin) {
		super(app);
		this.plugin = plugin;
		this.snippetManager = new SnippetManager(app);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'Style Settings Snippets Manager' });

		const newBtnContainer = contentEl.createDiv({ cls: 'qss-new-btn-container' });
		new Setting(newBtnContainer)
			.addButton(btn => btn
				.setButtonText('Create New Snippet')
				.setCta()
				.onClick(() => {
					this.close();
					new SnippetEditorModal(this.app, this.snippetManager).open();
				}));

		const snippetsList = contentEl.createDiv({ cls: 'qss-snippets-list' });
		await this.renderSnippetsList(snippetsList);
	}

	async renderSnippetsList(container: HTMLElement) {
		container.empty();
		const snippets = await this.snippetManager.listSnippets();

		if (snippets.length === 0) {
			container.createEl('p', { text: 'No snippets found.' });
			return;
		}

		snippets.forEach(snippet => {
			const item = container.createDiv({ cls: 'qss-snippet-item' });
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.marginBottom = '10px';
            item.style.padding = '10px';
            item.style.border = '1px solid var(--background-modifier-border)';
            item.style.borderRadius = '5px';

			item.createEl('span', { text: snippet, cls: 'qss-snippet-name' });

			const btnGroup = item.createDiv({ cls: 'qss-btn-group' });
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '10px';

			new Setting(btnGroup)
				.addButton(btn => btn
					.setButtonText('Edit')
					.onClick(() => {
						this.close();
						new SnippetEditorModal(this.app, this.plugin, this.snippetManager, snippet).open();
					}))
				.addButton(btn => btn
					.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						if (confirm(`Are you sure you want to delete "${snippet}"?`)) {
							await this.snippetManager.deleteSnippet(snippet);
							new Notice(`Deleted ${snippet}`);
							await this.renderSnippetsList(container);
						}
					}));
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
