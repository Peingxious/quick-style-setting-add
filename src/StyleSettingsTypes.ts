export type SettingType = 
    | 'heading' 
    | 'class-toggle' 
    | 'class-select' 
    | 'variable-text' 
    | 'variable-number' 
    | 'variable-number-slider' 
    | 'variable-select' 
    | 'variable-color' 
    | 'info-text';

export interface StyleSettingBase {
    id: string;
    title: string;
    description?: string;
    type: SettingType;
    css?: string; // Associated CSS code
    [key: string]: any; // Allow other properties like title.zh, description.zh
}

export interface StyleSettingHeading extends StyleSettingBase {
    type: 'heading';
    level: number;
    collapsed?: boolean;
}

export interface StyleSettingClassToggle extends StyleSettingBase {
    type: 'class-toggle';
    default?: boolean;
    addCommand?: boolean;
}

export interface StyleSettingOption {
    label: string;
    value: string;
}

export interface StyleSettingClassSelect extends StyleSettingBase {
    type: 'class-select';
    allowEmpty?: boolean;
    default?: string;
    options: (string | StyleSettingOption)[];
}

export interface StyleSettingVariableText extends StyleSettingBase {
    type: 'variable-text';
    default?: string;
    quotes?: boolean;
}

export interface StyleSettingVariableNumber extends StyleSettingBase {
    type: 'variable-number';
    default?: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface StyleSettingVariableNumberSlider extends StyleSettingBase {
    type: 'variable-number-slider';
    default?: number;
    min?: number;
    max?: number;
    step?: number;
    format?: string; // e.g. 'pixel', 'percent'
}

export interface StyleSettingVariableSelect extends StyleSettingBase {
    type: 'variable-select';
    default?: string;
    options: (string | StyleSettingOption)[];
}

export interface StyleSettingVariableColor extends StyleSettingBase {
    type: 'variable-color';
    default?: string;
    format?: 'hex' | 'rgb' | 'hsl' | 'hsl-split';
    opacity?: boolean;
}

export interface StyleSettingInfoText extends StyleSettingBase {
    type: 'info-text';
    markdown?: boolean;
}

export type StyleSetting = 
    | StyleSettingHeading 
    | StyleSettingClassToggle 
    | StyleSettingClassSelect 
    | StyleSettingVariableText 
    | StyleSettingVariableNumber 
    | StyleSettingVariableNumberSlider 
    | StyleSettingVariableSelect 
    | StyleSettingVariableColor
    | StyleSettingInfoText;

export interface StyleSettingsConfig {
    name?: string;
    id: string;
    settings: StyleSetting[];
    globalCss?: string;
    format?: 'cell' | 'asterisk';
}
