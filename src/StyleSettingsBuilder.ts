import { App, Setting, TextComponent, DropdownComponent, ToggleComponent, ButtonComponent, ExtraButtonComponent, TextAreaComponent, Modal, Notice } from 'obsidian';
import { StyleSettingsConfig, StyleSetting, SettingType, StyleSettingOption } from './StyleSettingsTypes';

export class StyleSettingsBuilder {
    containerEl: HTMLElement;
    config: StyleSettingsConfig;
    onChange: (newConfig: StyleSettingsConfig) => void;
    app: App;

    constructor(containerEl: HTMLElement, initialConfig: StyleSettingsConfig, onChange: (newConfig: StyleSettingsConfig) => void, app?: App) {
        this.containerEl = containerEl;
        this.config = initialConfig;
        this.onChange = onChange;
        this.app = app || (window as any).app;
        this.render();
    }

    render() {
        this.containerEl.empty();
        this.containerEl.addClass('style-settings-builder');

        // Global Config
        new Setting(this.containerEl)
            .setName('Section Name')
            .setDesc('The name displayed in Style Settings')
            .addText(text => text
                .setValue(this.config.name || '')
                .onChange(value => {
                    this.config.name = value;
                    this.notifyChange();
                }));

        new Setting(this.containerEl)
            .setName('Section ID')
            .setDesc('Unique ID for this section')
            .addText(text => text
                .setValue(this.config.id)
                .onChange(value => {
                    this.config.id = value;
                    this.notifyChange();
                }));

        this.containerEl.createEl('h3', { text: 'Settings' });

        // List Settings
        const settingsList = this.containerEl.createDiv('settings-list');
        
        let currentContainer = settingsList;
        let currentGroupChildren: HTMLElement | null = null;

        this.config.settings.forEach((setting, index) => {
            if (setting.type === 'heading') {
                // If we encounter a heading, we render it in the main list (or nested if we wanted, but let's keep it simple)
                // For now, all headings are treated as delimiters that start a new group at the top level
                // (or strictly following the user's "Level 2... below are children" logic).
                // To support nested levels properly is complex with a flat array, so we'll treat any heading as starting a new group.
                
                currentContainer = settingsList; // Reset to main list
                
                const groupContainer = settingsList.createDiv('setting-group');
                groupContainer.style.marginTop = '00px';
                groupContainer.style.marginBottom = '00px';

                
                // Create a container for children
                const childrenContainer = groupContainer.createDiv('setting-group-children');
                childrenContainer.style.paddingLeft = '15px';
                childrenContainer.style.borderLeft = '2px solid var(--background-modifier-border)';
                childrenContainer.style.marginLeft = '5px';
                
                // Determine initial visibility
                // @ts-ignore
                const isCollapsed = setting.collapsed === true;
                if (isCollapsed) {
                    childrenContainer.hide();
                }

                // Render the Heading Item, passing the children container to be controlled
                this.renderSettingItem(groupContainer, setting, index, childrenContainer);
                
                // Move children container to be after the heading item (which is appended to groupContainer)
                groupContainer.appendChild(childrenContainer);
                
                currentContainer = childrenContainer;
                currentGroupChildren = childrenContainer;
            } else {
                // Regular setting
                // If we have a current group, append there. Else append to main list.
                this.renderSettingItem(currentContainer, setting, index);
            }
        });

        // Add New Setting
        const addContainer = this.containerEl.createDiv('add-setting-container');
        addContainer.style.marginTop = '20px';
        addContainer.style.borderTop = '1px solid var(--background-modifier-border)';
        addContainer.style.paddingTop = '10px';

        let selectedType: SettingType = 'variable-color';

        new Setting(addContainer)
            .setName('Add New Setting')
            .addDropdown(dropdown => dropdown
                .addOption('heading', 'Heading')
                .addOption('variable-color', 'Color')
                .addOption('variable-text', 'Text')
                .addOption('variable-number', 'Number')
                .addOption('variable-number-slider', 'Slider')
                .addOption('class-toggle', 'Toggle')
                .addOption('class-select', 'Class Select')
                .addOption('variable-select', 'Variable Select')
                .addOption('info-text', 'Info Text')
                .setValue(selectedType)
                .onChange(value => selectedType = value as SettingType))
            .addButton(btn => btn
                .setButtonText('Add')
                .setCta()
                .onClick(() => {
                    this.addNewSetting(selectedType);
                }));
    }

    renderSettingItem(container: HTMLElement, setting: StyleSetting, index: number, controlledContainer?: HTMLElement) {
        const itemContainer = container.createDiv('setting-item');
        // Compact styles
        itemContainer.style.borderBottom = '1px solid var(--background-modifier-border)';
        itemContainer.style.backgroundColor = 'transparent';
        itemContainer.style.padding = '0px 0px'; // Reduced padding

        // --- Header Section ---
        const header = itemContainer.createDiv('setting-item-header');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '4px 0px'; // Reduced padding
        header.style.cursor = 'pointer';
        header.style.width = '100%';
        
        // Highlight active/controlled items slightly or use hover
        header.onmouseenter = () => header.style.backgroundColor = 'var(--background-modifier-hover)';
        header.onmouseleave = () => header.style.backgroundColor = 'transparent';

        // Drag Handle (Moved to First Position)
        const dragHandle = new ExtraButtonComponent(header)
            .setIcon('grip-vertical')
            .setTooltip('Drag to reorder')
            .extraSettingsEl;
        dragHandle.style.cursor = 'grab';
        dragHandle.setAttribute('draggable', 'true');
        dragHandle.style.color = 'var(--text-muted)';
        dragHandle.style.marginRight = '4px';

        // Drag Events
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/plain', index.toString());
            e.dataTransfer?.setDragImage(itemContainer, 0, 0);
            e.stopPropagation();
            
            // Add a class to body to indicate dragging
            document.body.addClass('is-dragging-setting');
        });

        dragHandle.addEventListener('dragend', (e) => {
             document.body.removeClass('is-dragging-setting');
        });

        // Make the Item Container a Drop Zone
        itemContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            e.stopPropagation();
            
            // Visual feedback
            const rect = itemContainer.getBoundingClientRect();
            const isTopHalf = e.clientY < rect.top + rect.height / 2;
            
            itemContainer.style.borderTop = isTopHalf ? '2px solid var(--interactive-accent)' : '';
            itemContainer.style.borderBottom = !isTopHalf ? '2px solid var(--interactive-accent)' : '1px solid var(--background-modifier-border)';
        });

        itemContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Reset styles
            itemContainer.style.borderTop = '';
            itemContainer.style.borderBottom = '1px solid var(--background-modifier-border)';
        });

        itemContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset styles
            itemContainer.style.borderTop = '';
            itemContainer.style.borderBottom = '1px solid var(--background-modifier-border)';

            const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1');
            if (fromIndex === -1) return;

            const rect = itemContainer.getBoundingClientRect();
            const insertAfter = e.clientY >= rect.top + rect.height / 2;
            
            this.reorderSetting(fromIndex, index, insertAfter);
        });

        if (controlledContainer) {
             header.style.fontWeight = 'bold';
        }

        // Collapse/Expand Icon for Headings
        if (controlledContainer) {
            const iconContainer = header.createSpan('setting-collapse-icon');
            iconContainer.style.marginRight = '8px';
            iconContainer.style.display = 'flex';
            iconContainer.style.alignItems = 'center';
            
            // @ts-ignore
            const isCollapsed = setting.collapsed === true;
            
            const updateIcon = () => {
                iconContainer.empty();
                // @ts-ignore
                if (setting.collapsed) {
                     new ExtraButtonComponent(iconContainer).setIcon('chevron-right').setTooltip('Expand');
                } else {
                     new ExtraButtonComponent(iconContainer).setIcon('chevron-down').setTooltip('Collapse');
                }
            };
            updateIcon();
            
            // Override click to toggle children
            iconContainer.onclick = (e) => {
                e.stopPropagation();
                // @ts-ignore
                setting.collapsed = !setting.collapsed;
                // @ts-ignore
                if (setting.collapsed) {
                    controlledContainer.hide();
                } else {
                    controlledContainer.show();
                }
                updateIcon();
                this.notifyChange();
            };
        }

        const titleText = setting.title || 'Untitled';
        const titleEl = header.createEl('span', { text: titleText, cls: 'setting-title' });
        titleEl.style.flex = '1';
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.style.overflow = 'hidden';
        titleEl.style.textOverflow = 'ellipsis';
        titleEl.style.marginRight = '10px';
        titleEl.style.fontSize = '1em';
        
        const controls = header.createDiv('setting-controls');
        controls.style.display = 'flex';
        controls.style.gap = '4px'; // Tighter gap
        controls.style.alignItems = 'center';
        controls.style.marginLeft = 'auto'; // Force right alignment

        const typeBadge = controls.createEl('span', { text: setting.type, cls: 'setting-type-badge' });
        typeBadge.style.fontSize = '0.7em';
        typeBadge.style.color = 'var(--text-muted)';
        typeBadge.style.marginRight = '4px';
        typeBadge.style.whiteSpace = 'nowrap';
        
        

        // Delete
        const deleteBtn = new ExtraButtonComponent(controls)
            .setIcon('trash')
            .setTooltip('Delete')
            .onClick(async (e) => {
                if (e) e.stopPropagation();
                // Double check confirmation? For now just delete with feedback.
                this.deleteSetting(index);
            });
        deleteBtn.extraSettingsEl.style.cursor = 'pointer';

        // Toggle Group Logic (Shared)
        const toggleGroup = () => {
             // @ts-ignore
             setting.collapsed = !setting.collapsed;
             // @ts-ignore
             if (setting.collapsed) {
                 controlledContainer.hide();
             } else {
                 controlledContainer.show();
             }
             // Update icon visual
             const iconContainer = header.querySelector('.setting-collapse-icon');
             if (iconContainer) {
                 iconContainer.empty();
                  // @ts-ignore
                 if (setting.collapsed) {
                     new ExtraButtonComponent(iconContainer as HTMLElement).setIcon('chevron-right').setTooltip('Expand');
                 } else {
                     new ExtraButtonComponent(iconContainer as HTMLElement).setIcon('chevron-down').setTooltip('Collapse');
                 }
             }
             this.notifyChange();
        };

        // --- Details Section ---
        // Click header to open details (for both regular settings and headings)
        header.onclick = (e) => {
            // Don't trigger if clicking controls or collapse icon
            if ((e.target as HTMLElement).closest('.setting-controls')) return;
            if ((e.target as HTMLElement).closest('.setting-collapse-icon')) return;
            
            new SettingDetailModal(this.app, this, setting, titleEl).open();
        };

        // Separate logic for collapse icon (Headings only)
        if (controlledContainer) {
             const iconContainer = header.querySelector('.setting-collapse-icon');
             if (iconContainer) {
                 (iconContainer as HTMLElement).onclick = (e) => {
                     e.stopPropagation(); // Prevent opening modal
                     toggleGroup();
                 };
             }
        }
    }

    renderSettingFields(container: HTMLElement, setting: StyleSetting, titleEl: HTMLElement) {
        // Layout: Split view if not heading (Left: Meta, Right: CSS)
        // If heading, just single column (Meta only)

        let metaContainer = container;
        let cssContainer: HTMLElement | null = null;

        if (setting.type !== 'heading') {
            container.empty(); // Clear existing if any (though usually empty)
            const splitContainer = container.createDiv('setting-split-container');
            splitContainer.style.display = 'flex';
            splitContainer.style.gap = '20px';
            splitContainer.style.alignItems = 'flex-start';
            splitContainer.style.height = '100%';

            metaContainer = splitContainer.createDiv('setting-meta-column');
            metaContainer.style.flex = '1';
            metaContainer.style.minWidth = '300px'; // Ensure reasonable width
            metaContainer.style.overflowY = 'auto';

            cssContainer = splitContainer.createDiv('setting-css-column');
            cssContainer.style.flex = '1';
            cssContainer.style.minWidth = '300px';
            cssContainer.style.display = 'flex';
            cssContainer.style.flexDirection = 'column';
            cssContainer.style.height = '100%';
        }

        // Common Fields (Rendered into metaContainer)
        new Setting(metaContainer)
            .setName('ID')
            .setDesc('CSS variable name or class name')
            .addText(text => text
                .setValue(setting.id)
                .onChange(value => {
                    setting.id = value;
                    this.notifyChange();
                }));

        new Setting(metaContainer)
            .setName('Title')
            .addText(text => text
                .setValue(setting.title)
                .onChange(value => {
                    setting.title = value;
                    titleEl.setText(value || 'Untitled'); // Live update header
                    this.notifyChange();
                }));

        new Setting(metaContainer)
            .setName('Description')
            .addTextArea(text => text
                .setValue(setting.description || '')
                .onChange(value => {
                    setting.description = value;
                    this.notifyChange();
                }));

        // Type Specific Fields (Rendered into metaContainer)
        switch (setting.type) {
            case 'heading':
                new Setting(metaContainer)
                    .setName('Level')
                    .addSlider(slider => slider
                        .setLimits(1, 6, 1)
                        .setValue((setting as any).level || 1)
                        .onChange(value => {
                            (setting as any).level = value;
                            this.notifyChange();
                        }));
                break;
            case 'variable-color':
                new Setting(metaContainer)
                    .setName('Default Color')
                    .addColorPicker(color => color
                        .setValue((setting as any).default || '#000000')
                        .onChange(value => {
                            (setting as any).default = value;
                            this.notifyChange();
                        }));
                 new Setting(metaContainer)
                    .setName('Format')
                    .addDropdown(dd => dd
                        .addOption('hex', 'HEX')
                        .addOption('rgb', 'RGB')
                        .addOption('hsl', 'HSL')
                        .setValue((setting as any).format || 'hex')
                        .onChange(value => {
                            (setting as any).format = value;
                            this.notifyChange();
                        }));
                break;
            case 'variable-text':
                new Setting(metaContainer)
                    .setName('Default Text')
                    .addText(text => text
                        .setValue((setting as any).default || '')
                        .onChange(value => {
                            (setting as any).default = value;
                            this.notifyChange();
                        }));
                break;
            case 'variable-number':
            case 'variable-number-slider':
                new Setting(metaContainer)
                    .setName('Default Number')
                    .addText(text => text
                        .setValue(String((setting as any).default || 0))
                        .onChange(value => {
                            (setting as any).default = Number(value);
                            this.notifyChange();
                        }));
                new Setting(metaContainer).setName('Min').addText(t => t.setValue(String((setting as any).min || '')).onChange(v => { (setting as any).min = Number(v); this.notifyChange(); }));
                new Setting(metaContainer).setName('Max').addText(t => t.setValue(String((setting as any).max || '')).onChange(v => { (setting as any).max = Number(v); this.notifyChange(); }));
                new Setting(metaContainer).setName('Step').addText(t => t.setValue(String((setting as any).step || '')).onChange(v => { (setting as any).step = Number(v); this.notifyChange(); }));
                break;
             case 'class-toggle':
                 new Setting(metaContainer)
                    .setName('Default On')
                    .addToggle(toggle => toggle
                        .setValue((setting as any).default || false)
                        .onChange(value => {
                            (setting as any).default = value;
                            this.notifyChange();
                        }));
                break;
             // Add others as needed
        }

        // CSS Code Section (Rendered into cssContainer)
        if (setting.type !== 'heading' && cssContainer) {
            // Header for CSS Column
            const cssHeader = cssContainer.createDiv('setting-css-header');
            cssHeader.style.marginBottom = '10px';
            cssHeader.createEl('div', { text: 'CSS Code', cls: 'setting-item-name' });
            cssHeader.createEl('div', { text: 'CSS associated with this setting.', cls: 'setting-item-description' });

            const textArea = new TextAreaComponent(cssContainer)
                .setValue(setting.css || '')
                .setPlaceholder('/* CSS Code here... */')
                .onChange(value => {
                    setting.css = value;
                    this.notifyChange();
                });
            
            textArea.inputEl.style.width = '100%';
            textArea.inputEl.style.height = '200px';
            textArea.inputEl.style.fontFamily = 'monospace';
            textArea.inputEl.style.whiteSpace = 'pre';
        }
    }

    addNewSetting(type: SettingType) {
        const newSetting: StyleSetting = {
            id: `new-${type}-${Date.now()}`,
            title: 'New Setting',
            type: type,
            description: ''
        } as any;

        // Set defaults based on type
        if (type === 'heading') (newSetting as any).level = 3;
        if (type === 'variable-color') { (newSetting as any).default = '#000000'; (newSetting as any).format = 'hex'; }
        if (type === 'variable-number') (newSetting as any).default = 0;

        this.config.settings.push(newSetting);
        this.notifyChange();
        this.render();
    }

    deleteSetting(index: number) {
        const settings = this.config.settings;
        if (index < 0 || index >= settings.length) return;

        const itemToDelete = settings[index];
        let deleteCount = 1;

        // If deleting a heading, delete its children too
        if (itemToDelete.type === 'heading') {
             let i = index + 1;
             while (i < settings.length && settings[i].type !== 'heading') {
                 i++;
             }
             deleteCount = i - index;
        }

        settings.splice(index, deleteCount);
        new Notice(`Deleted ${deleteCount} item(s)`);
        this.notifyChange();
        this.render();
    }

    moveSetting(index: number, direction: number) {
        const settings = this.config.settings;
        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= settings.length) return;

        // Swap
        [settings[index], settings[newIndex]] = [settings[newIndex], settings[index]];
        
        this.notifyChange();
        this.render();
    }

    reorderSetting(fromIndex: number, toIndex: number, insertAfter: boolean) {
        const settings = this.config.settings;
        if (fromIndex === toIndex) return;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= settings.length || toIndex < 0 || toIndex >= settings.length) return;

        const itemToMove = settings[fromIndex];
        let moveCount = 1;

        // If moving a heading, include its children (until next heading)
        if (itemToMove.type === 'heading') {
             let i = fromIndex + 1;
             while (i < settings.length && settings[i].type !== 'heading') {
                 i++;
             }
             moveCount = i - fromIndex;
        }

        // Check if dropping inside itself
        // Original range: [fromIndex, fromIndex + moveCount - 1]
        // Target index: toIndex
        if (toIndex >= fromIndex && toIndex < fromIndex + moveCount) return;

        // Extract the chunk
        const chunk = settings.slice(fromIndex, fromIndex + moveCount);
        
        // Remove chunk
        settings.splice(fromIndex, moveCount);
        
        // Adjust toIndex
        // If we removed from before the target, the target index shifts down
        if (fromIndex < toIndex) {
            toIndex -= moveCount;
        }
        
        // Apply insertAfter
        if (insertAfter) {
            toIndex++;
        }
        
        // Insert chunk
        settings.splice(toIndex, 0, ...chunk);
        
        this.notifyChange();
        this.render();
    }

    notifyChange() {
        this.onChange(this.config);
    }
}

class SettingDetailModal extends Modal {
    builder: StyleSettingsBuilder;
    setting: StyleSetting;
    titleEl: HTMLElement;

    constructor(app: App, builder: StyleSettingsBuilder, setting: StyleSetting, titleEl: HTMLElement) {
        super(app);
        this.builder = builder;
        this.setting = setting;
        this.titleEl = titleEl;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('setting-detail-modal');
        // Maximize modal
        this.modalEl.style.width = '80vw';
        this.modalEl.style.height = '80vh';
        this.modalEl.style.maxWidth = '1000px';

        contentEl.createEl('h2', { text: `Edit Setting: ${this.setting.title || 'Untitled'}` });

        const body = contentEl.createDiv('setting-detail-body');
        body.style.height = 'calc(100% - 60px)'; // Subtract header space
        body.style.overflow = 'hidden';

        // Reuse the renderSettingFields logic
        this.builder.renderSettingFields(body, this.setting, this.titleEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
