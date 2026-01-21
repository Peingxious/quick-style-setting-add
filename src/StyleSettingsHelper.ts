import { parseYaml, stringifyYaml } from 'obsidian';
import { StyleSettingsConfig, StyleSetting } from './StyleSettingsTypes';

export class StyleSettingsHelper {

    static extractConfig(cssContent: string): StyleSettingsConfig | null {
        const regex = /\/\* @settings([\s\S]*?)\*\//;
        const match = cssContent.match(regex);
        if (match && match[1]) {
            try {
                // Replace tabs with spaces to ensure valid YAML
                const yamlContent = match[1].replace(/\t/g, '    ');
                return parseYaml(yamlContent);
            } catch (e) {
                console.error("Failed to parse Style Settings YAML", e);
                return null;
            }
        }
        return null;
    }

    static updateConfig(cssContent: string, config: StyleSettingsConfig): string {
        const yaml = stringifyYaml(config);
        const settingsBlock = `/* @settings\n${yaml}\n*/`;
        
        const regex = /\/\* @settings([\s\S]*?)\*\//;
        if (regex.test(cssContent)) {
            return cssContent.replace(regex, settingsBlock);
        } else {
            return `${settingsBlock}\n\n${cssContent}`;
        }
    }
}
