import { App, Plugin, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import { SnippetManagerModal } from './src/SnippetManagerModal';
import { StyleSettingsView, VIEW_TYPE_STYLE_SETTINGS } from './src/StyleSettingsView';

export default class QuickStyleSettingsPlugin extends Plugin {
	async onload() {
        this.registerView(
            VIEW_TYPE_STYLE_SETTINGS,
            (leaf) => new StyleSettingsView(leaf, this)
        );

		this.addCommand({
			id: 'open-snippet-manager',
			name: 'Manage Style Settings Snippets',
			callback: () => {
				new SnippetManagerModal(this.app, this).open();
			}
		});

        this.addCommand({
            id: 'open-style-settings-view',
            name: 'Open Style Settings Manager View',
            callback: () => {
                this.activateView();
            }
        });

        // Add Ribbon Icon
        this.addRibbonIcon('paint-bucket', 'Manage Style Settings', (evt: MouseEvent) => {
             // Prefer opening the view if closed, or modal? 
             // Let's open the view as it's more "Right and bottom"
             this.activateView();
        });

        // Add Status Bar Item
        const statusBarItemEl = this.addStatusBarItem();
        setIcon(statusBarItemEl, 'paint-bucket');
        statusBarItemEl.setAttribute('aria-label', 'Style Settings Manager');
        statusBarItemEl.addClass('mod-clickable');
        statusBarItemEl.onClickEvent(() => {
            this.activateView();
        });
	}

	onunload() {

	}

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_STYLE_SETTINGS);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                 leaf = rightLeaf;
                 await leaf.setViewState({ type: VIEW_TYPE_STYLE_SETTINGS, active: true });
            }
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
