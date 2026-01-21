import { App, Modal, Setting, Notice, TextAreaComponent } from 'obsidian';
import { SnippetManager } from './SnippetManager';
import { SnippetManagerModal } from './SnippetManagerModal';
import QuickStyleSettingsPlugin from '../main';
import { StyleSettingsBuilder } from './StyleSettingsBuilder';
import { StyleSettingsHelper } from './StyleSettingsHelper';
import { StyleSettingsConfig } from './StyleSettingsTypes';

const DEFAULT_TEMPLATE = `/* @settings
name: New Section
id: new-section
settings:
    - 
        id: my-color
        title: My Color
        type: variable-color
        default: '#ff0000'
*/

body {
    /* Use your variables here */
    --my-color: #ff0000;
}
`;

export class SnippetEditorModal extends Modal {
	plugin: QuickStyleSettingsPlugin;
	snippetManager: SnippetManager;
	originalName: string | null;
	currentName: string;
	currentContent: string;
    activeTab: 'builder' | 'code' = 'builder';
    
    // UI Elements
    contentContainer: HTMLElement;
    builderContainer: HTMLElement;
    codeContainer: HTMLElement;
    
	constructor(app: App, plugin: QuickStyleSettingsPlugin, snippetManager: SnippetManager, snippetName: string | null = null) {
		super(app);
		this.plugin = plugin;
		this.snippetManager = snippetManager;
		this.originalName = snippetName;
		this.currentName = snippetName || '';
		this.currentContent = '';
	}

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qss-modal');
        // Maximize width/height for better split view experience
        this.modalEl.style.width = '90vw';
        this.modalEl.style.height = '90vh';
        this.modalEl.style.maxWidth = '100vw';
        this.modalEl.style.maxHeight = '100vh';

        // Load content (asynchronous but we can start UI)
        if (this.originalName) {
            this.snippetManager.readSnippet(this.originalName).then(content => {
                this.currentContent = content;
                // Refresh UI after load if needed, but we init with empty or template
                this.renderSplitView();
            });
        } else {
            this.currentContent = DEFAULT_TEMPLATE;
            this.renderSplitView();
        }

        const header = contentEl.createEl('h2', { text: this.originalName ? `Edit ${this.originalName}` : 'Create New Snippet' });
        header.style.marginBottom = '10px';

        // Filename Input
        new Setting(contentEl)
            .setName('Filename')
            .setDesc('Must end with .css')
            .addText(text => text
                .setValue(this.currentName)
                .onChange(value => {
                    this.currentName = value;
                }));

        // Main Content Container (Split View)
        this.contentContainer = contentEl.createDiv('qss-content-container');
        this.contentContainer.style.display = 'flex';
        this.contentContainer.style.flexDirection = 'row';
        this.contentContainer.style.gap = '20px';
        this.contentContainer.style.height = 'calc(100% - 150px)'; // Adjust based on header/footer
        this.contentContainer.style.overflow = 'hidden';

        // Left Panel: Builder
        const leftPanel = this.contentContainer.createDiv('qss-left-panel');
        leftPanel.style.flex = '1';
        leftPanel.style.display = 'flex';
        leftPanel.style.flexDirection = 'column';
        leftPanel.style.overflow = 'hidden';
        leftPanel.createEl('h3', { text: 'Settings Builder' }).style.margin = '0 0 10px 0';
        
        this.builderContainer = leftPanel.createDiv('qss-builder-view');
        this.builderContainer.style.flex = '1';
        this.builderContainer.style.overflowY = 'auto';
        this.builderContainer.style.paddingRight = '10px'; // Avoid scrollbar overlap

        // Right Panel: CSS Code
        const rightPanel = this.contentContainer.createDiv('qss-right-panel');
        rightPanel.style.flex = '1';
        rightPanel.style.display = 'flex';
        rightPanel.style.flexDirection = 'column';
        rightPanel.style.overflow = 'hidden';
        rightPanel.createEl('h3', { text: 'CSS Code' }).style.margin = '0 0 10px 0';

        this.codeContainer = rightPanel.createDiv('qss-code-view');
        this.codeContainer.style.flex = '1';
        this.codeContainer.style.display = 'flex';
        this.codeContainer.style.flexDirection = 'column';

        // Footer Actions
        const footer = contentEl.createDiv('qss-footer');
        footer.style.marginTop = '20px';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '10px';

        new Setting(footer)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.close();
                    new SnippetManagerModal(this.app, this.plugin).open();
                }))
            .addButton(btn => btn
                .setButtonText('Save')
                .setCta()
                .onClick(async () => {
                    await this.saveSnippet();
                }));
    }

    renderSplitView() {
        this.renderBuilder();
        this.renderCodeEditor();
    }

    switchTab(tab: 'builder' | 'code') {
        // Deprecated: using split view now
    }

    renderBuilder() {
        this.builderContainer.empty();
        
        let config = StyleSettingsHelper.extractConfig(this.currentContent);
        if (!config) {
            config = {
                id: 'my-style-settings',
                name: 'My Style Settings',
                settings: []
            };
        }

        new StyleSettingsBuilder(this.builderContainer, config, (newConfig) => {
            // When builder updates, update the CSS content string
            // We need to merge the new config into the existing CSS content (which might have been edited in the code view)
            // But wait, if user edited code view, 'currentContent' is updated.
            // StyleSettingsHelper.updateConfig replaces the YAML block in 'currentContent' with newConfig
            this.currentContent = StyleSettingsHelper.updateConfig(this.currentContent, newConfig);
            
            // AND we need to update the Code Editor view to reflect the new YAML
            // But we shouldn't re-render the whole editor if focused, it loses cursor.
            // For now, let's just update the value if possible.
            const textArea = this.codeContainer.querySelector('textarea');
            if (textArea) {
                const cursor = textArea.selectionStart;
                textArea.value = this.currentContent;
                // Attempt to restore cursor, though it might jump due to length change
                // Ideally we only replace the top block.
            }
        });
    }

    renderCodeEditor() {
        this.codeContainer.empty();
        
        const textArea = new TextAreaComponent(this.codeContainer)
            .setValue(this.currentContent)
            .onChange(value => {
                this.currentContent = value;
                // Debounce update builder?
                // If we update builder on every keypress, it might be slow or disruptive.
                // For now, let's add a "Refresh Builder" button or update on blur?
                // Or just don't auto-update builder from code to avoid conflict loops.
            });
        
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.height = '100%';
        textArea.inputEl.style.fontFamily = 'monospace';
        textArea.inputEl.style.resize = 'none';

        // Add a "Refresh Builder" button in the Code header?
        // Actually, let's just leave it. If they edit YAML manually, they might break the builder state until reload.
        // To be safe: Only Builder -> Code sync is automatic. Code -> Builder requires re-opening or explicit action.
        // Let's add a small "Sync to Builder" button above the code area.
        
        const controls = this.codeContainer.createDiv('code-controls');
        controls.style.marginBottom = '5px';
        controls.style.display = 'flex';
        controls.style.justifyContent = 'flex-end';
        
        new ButtonComponent(controls)
            .setButtonText('Refresh Builder from Code')
            .setIcon('refresh-cw')
            .onClick(() => {
                this.renderBuilder();
                new Notice('Builder updated from code');
            });
            
        // Re-append textarea to be below controls
        this.codeContainer.appendChild(textArea.inputEl);
    }

    async saveSnippet() {
        if (!this.currentName.endsWith('.css')) {
            this.currentName += '.css';
        }
        
        if (this.originalName && this.originalName !== this.currentName) {
             await this.snippetManager.deleteSnippet(this.originalName);
        }
        
        await this.snippetManager.writeSnippet(this.currentName, this.currentContent);
        new Notice('Snippet saved.');
        this.close();
        new SnippetManagerModal(this.app, this.plugin).open();
    }

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
