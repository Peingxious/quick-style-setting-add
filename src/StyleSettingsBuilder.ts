import { App, Setting, TextComponent, DropdownComponent, ToggleComponent, ButtonComponent, ExtraButtonComponent, TextAreaComponent } from 'obsidian';
import { StyleSettingsConfig, StyleSetting, SettingType, StyleSettingOption } from './StyleSettingsTypes';

export class StyleSettingsBuilder {
    containerEl: HTMLElement;
    config: StyleSettingsConfig;
    onChange: (newConfig: StyleSettingsConfig) => void;

    constructor(containerEl: HTMLElement, initialConfig: StyleSettingsConfig, onChange: (newConfig: StyleSettingsConfig) => void) {
        this.containerEl = containerEl;
        this.config = initialConfig;
        this.onChange = onChange;
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
        this.config.settings.forEach((setting, index) => {
            this.renderSettingItem(settingsList, setting, index);
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

    renderSettingItem(container: HTMLElement, setting: StyleSetting, index: number) {
        const itemContainer = container.createDiv('setting-item');
        itemContainer.style.border = '1px solid var(--background-modifier-border)';
        itemContainer.style.borderRadius = '5px';
        itemContainer.style.marginBottom = '10px';
        itemContainer.style.backgroundColor = 'var(--background-secondary)';

        // --- Header Section (Title on Top) ---
        const header = itemContainer.createDiv('setting-item-header');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10px';
        header.style.borderBottom = '1px solid var(--background-modifier-border)';
        header.style.cursor = 'pointer';
        header.style.backgroundColor = 'var(--background-secondary-alt)';
        header.style.borderTopLeftRadius = '5px';
        header.style.borderTopRightRadius = '5px';

        const titleText = setting.title || 'Untitled';
        const titleEl = header.createEl('span', { text: titleText, cls: 'setting-title' });
        titleEl.style.fontWeight = 'bold';
        titleEl.style.fontSize = '1.1em';
        
        const typeBadge = header.createEl('span', { text: setting.type, cls: 'setting-type-badge' });
        typeBadge.style.fontSize = '0.8em';
        typeBadge.style.color = 'var(--text-muted)';
        typeBadge.style.marginLeft = '10px';

        const controls = header.createDiv('setting-controls');
        controls.style.marginLeft = 'auto'; // Push controls to the right
        
        // Copy Variable
        if (setting.type.startsWith('variable-')) {
             new ExtraButtonComponent(controls)
                .setIcon('copy')
                .setTooltip('Copy CSS Variable')
                .onClick((e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`var(--${setting.id})`);
                });
        }

        // Up/Down
        if (index > 0) {
            new ExtraButtonComponent(controls)
                .setIcon('arrow-up')
                .setTooltip('Move Up')
                .onClick((e) => {
                    e.stopPropagation();
                    this.moveSetting(index, -1);
                });
        }
        if (index < this.config.settings.length - 1) {
            new ExtraButtonComponent(controls)
                .setIcon('arrow-down')
                .setTooltip('Move Down')
                .onClick((e) => {
                    e.stopPropagation();
                    this.moveSetting(index, 1);
                });
        }

        // Delete
        new ExtraButtonComponent(controls)
            .setIcon('trash')
            .setTooltip('Delete')
            .onClick((e) => {
                e.stopPropagation();
                this.deleteSetting(index);
            });

        // --- Details Section ---
        const detailsContainer = itemContainer.createDiv('setting-details');
        detailsContainer.style.padding = '10px';
        // Toggle visibility on header click
        let isExpanded = true;
        // Optional: Start collapsed if needed, but user likely wants to edit
        
        header.onclick = (e) => {
            // Don't toggle if clicking controls
            if ((e.target as HTMLElement).closest('.setting-controls')) return;
            
            isExpanded = !isExpanded;
            if (isExpanded) {
                detailsContainer.show();
                header.style.borderBottom = '1px solid var(--background-modifier-border)';
            } else {
                detailsContainer.hide();
                header.style.borderBottom = 'none';
            }
        };

        this.renderSettingFields(detailsContainer, setting, index, titleEl);
    }

    renderSettingFields(container: HTMLElement, setting: StyleSetting, index: number, titleEl: HTMLElement) {
        // Common Fields
        new Setting(container)
            .setName('ID')
            .setDesc('CSS variable name or class name')
            .addText(text => text
                .setValue(setting.id)
                .onChange(value => {
                    setting.id = value;
                    this.notifyChange();
                }));

        new Setting(container)
            .setName('Title')
            .addText(text => text
                .setValue(setting.title)
                .onChange(value => {
                    setting.title = value;
                    titleEl.setText(value || 'Untitled'); // Live update header
                    this.notifyChange();
                }));

        new Setting(container)
            .setName('Description')
            .addTextArea(text => text
                .setValue(setting.description || '')
                .onChange(value => {
                    setting.description = value;
                    this.notifyChange();
                }));

        // Type Specific Fields
        switch (setting.type) {
            case 'heading':
                new Setting(container)
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
                new Setting(container)
                    .setName('Default Color')
                    .addColorPicker(color => color
                        .setValue((setting as any).default || '#000000')
                        .onChange(value => {
                            (setting as any).default = value;
                            this.notifyChange();
                        }));
                 new Setting(container)
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
                new Setting(container)
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
                new Setting(container)
                    .setName('Default Number')
                    .addText(text => text
                        .setValue(String((setting as any).default || 0))
                        .onChange(value => {
                            (setting as any).default = Number(value);
                            this.notifyChange();
                        }));
                new Setting(container).setName('Min').addText(t => t.setValue(String((setting as any).min || '')).onChange(v => { (setting as any).min = Number(v); this.notifyChange(); }));
                new Setting(container).setName('Max').addText(t => t.setValue(String((setting as any).max || '')).onChange(v => { (setting as any).max = Number(v); this.notifyChange(); }));
                new Setting(container).setName('Step').addText(t => t.setValue(String((setting as any).step || '')).onChange(v => { (setting as any).step = Number(v); this.notifyChange(); }));
                break;
             case 'class-toggle':
                 new Setting(container)
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
        this.config.settings.splice(index, 1);
        this.notifyChange();
        this.render();
    }

    moveSetting(index: number, direction: number) {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < this.config.settings.length) {
            const temp = this.config.settings[index];
            this.config.settings[index] = this.config.settings[targetIndex];
            this.config.settings[targetIndex] = temp;
            this.notifyChange();
            this.render();
        }
    }

    notifyChange() {
        this.onChange(this.config);
    }
}
