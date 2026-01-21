import { ItemView, WorkspaceLeaf, Notice, ButtonComponent } from 'obsidian';
import { SnippetManager } from './SnippetManager';
import { SnippetEditorModal } from './SnippetEditorModal';
import QuickStyleSettingsPlugin from '../main';

export const VIEW_TYPE_STYLE_SETTINGS = 'style-settings-manager-view';

export class StyleSettingsView extends ItemView {
    plugin: QuickStyleSettingsPlugin;
    snippetManager: SnippetManager;

    constructor(leaf: WorkspaceLeaf, plugin: QuickStyleSettingsPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.snippetManager = new SnippetManager(plugin.app);
    }

    getViewType() {
        return VIEW_TYPE_STYLE_SETTINGS;
    }

    getDisplayText() {
        return 'Style Settings Manager';
    }

    getIcon() {
        return 'paint-bucket';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('style-settings-view');

        container.createEl('h4', { text: 'Style Settings Snippets' });

        const btnContainer = container.createDiv('view-btn-container');
        btnContainer.style.marginBottom = '10px';
        
        new ButtonComponent(btnContainer)
            .setButtonText('Refresh')
            .setIcon('refresh-cw')
            .onClick(() => this.renderList());

        new ButtonComponent(btnContainer)
            .setButtonText('New Snippet')
            .setCta()
            .onClick(() => {
                new SnippetEditorModal(this.app, this.plugin, this.snippetManager).open();
            });

        const listContainer = container.createDiv('snippets-list');
        await this.renderList(listContainer);
    }

    async renderList(container?: HTMLElement) {
        const target = container || this.containerEl.querySelector('.snippets-list') as HTMLElement;
        if (!target) return;
        
        target.empty();
        const snippets = await this.snippetManager.listSnippets();

        if (snippets.length === 0) {
            target.createEl('p', { text: 'No snippets found.', cls: 'text-muted' });
            return;
        }

        snippets.forEach(snippet => {
            const item = target.createDiv('snippet-item-view');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '8px';
            item.style.borderBottom = '1px solid var(--background-modifier-border)';
            item.style.cursor = 'pointer';

            item.createEl('span', { text: snippet });

            const actions = item.createDiv('snippet-actions');
            actions.style.display = 'flex';
            actions.style.gap = '5px';

            new ButtonComponent(actions)
                .setIcon('edit')
                .setTooltip('Edit')
                .onClick((e) => {
                    e.stopPropagation();
                    new SnippetEditorModal(this.app, this.plugin, this.snippetManager, snippet).open();
                });
            
             new ButtonComponent(actions)
                .setIcon('trash')
                .setTooltip('Delete')
                .setWarning()
                .onClick(async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${snippet}?`)) {
                        await this.snippetManager.deleteSnippet(snippet);
                        this.renderList();
                    }
                });
        });
    }

    async onClose() {
        // Nothing to clean up
    }
}
