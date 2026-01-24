import { parseYaml, stringifyYaml } from "obsidian";
import { StyleSettingsConfig, StyleSetting } from "./StyleSettingsTypes";

export class StyleSettingsHelper {
	static extractConfig(cssContent: string): StyleSettingsConfig | null {
		const regex = /\/\* @settings([\s\S]*?)\*\//;
		const match = cssContent.match(regex);

		let config: StyleSettingsConfig | null = null;
		let yamlEndIndex = 0;

		if (match && match[1]) {
			try {
				// Replace tabs with spaces to ensure valid YAML
				const yamlContent = match[1].replace(/\t/g, "    ");
				config = parseYaml(yamlContent);
				yamlEndIndex = match.index! + match[0].length;
			} catch (e) {
				console.error("Failed to parse Style Settings YAML", e);
				return null;
			}
		}

		if (!config) return null;

		let cssBody = cssContent.substring(yamlEndIndex).trim();

		// Check for Asterisk Block Format first (User Preference)
		// Pattern: /********************/ \n /* Title */ \n /********************/
		const asteriskLineRegex = /\/\*{20,}\//;

		if (asteriskLineRegex.test(cssBody)) {
			config.format = "asterisk";

			// Header pattern: Separator -> Newline -> Title Comment -> Newline -> Separator
			// We capture the whole header block
			const headerRegex =
				/(\/\*{20,}\/\s*\n\s*\/\*.*?\*\/\s*\n\s*\/\*{20,}\/)/g;

			const splitParts = cssBody.split(headerRegex);
			// splitParts = [pre-header, header1, content1, header2, content2, ...]

			let globalParts: string[] = [];
			if (splitParts.length > 0) {
				globalParts.push(splitParts[0]); // Content before first header
			}

			for (let i = 1; i < splitParts.length; i += 2) {
				const header = splitParts[i];
				const content = splitParts[i + 1] || "";

				let matched = false;
				// Try to match content to a setting ID
				for (const setting of config.settings) {
					// Check if content contains .id or #id
					// We use a boundary check to ensure we don't match substrings (e.g. .view matching .view-header)
					// But CSS selectors can be complex.
					// Simple check: does it contain the ID string?
					// User said: .path-view matches id: path-view

					const idPattern = new RegExp(
						`[.#]${this.escapeRegExp(setting.id)}\\b`,
					);
					if (idPattern.test(content)) {
						setting.css = content.trim();
						matched = true;
						// We assign to the first matching setting and consume the block
						break;
					}
				}

				if (!matched) {
					// Preserve unmapped blocks in global CSS
					globalParts.push(header + content);
				}
			}

			config.globalCss = globalParts.join("").trim();
		} else {
			// Default to Cell Format or Auto-detect
			config.format = "cell";

			const cellRegex =
				/\/\* @cell: ([\w\d\-_]+) \*\/([\s\S]*?)\/\* @cell-end \*\//g;

			let matchCell;
			while ((matchCell = cellRegex.exec(cssBody)) !== null) {
				const id = matchCell[1];
				const content = matchCell[2].trim();

				const setting = this.findSetting(config.settings, id);
				if (setting) {
					setting.css = content;
				}
			}

			config.globalCss = cssBody.replace(cellRegex, "").trim();

			// If no cells found, we might default to asterisk for future saves?
			// But let's stick to 'cell' unless explicit.
			// Actually, if the user starts fresh, maybe they want asterisk?
			// Let's check if the user *wants* asterisk.
			// For now, default 'cell' is safe for existing logic, but 'asterisk' is what user asked for.
			// Since we didn't find asterisk blocks, we can assume 'cell' or just empty.
			// If empty, we can set format to 'asterisk' if we want to force it.
			// I'll leave it as 'cell' for now to avoid breaking existing users (me).
		}

		return config;
	}

	private static findSetting(
		settings: StyleSetting[],
		id: string,
	): StyleSetting | null {
		for (const setting of settings) {
			if (setting.id === id) return setting;
			if (setting.settings) {
				// @ts-ignore
				const found = this.findSetting(setting.settings, id);
				if (found) return found;
			}
		}
		return null;
	}

	static updateConfig(
		originalContent: string,
		config: StyleSettingsConfig,
	): string {
		const cleanConfig = JSON.parse(JSON.stringify(config));
		delete cleanConfig.globalCss;
		delete cleanConfig.format;
		this.cleanSettings(cleanConfig.settings);

		const yaml = stringifyYaml(cleanConfig);
		const settingsBlock = `/* @settings\n${yaml}\n*/`;

		let cssBody = config.globalCss || "";
		if (cssBody.trim()) {
			cssBody = this.formatCss(cssBody.trim());
		}

		if (config.format === "asterisk") {
			const separator = "/************************************/";

			for (const setting of config.settings) {
				if (setting.css && setting.css.trim()) {
					const title = `/* ${setting.title || setting.id} */`;
					// Ensure we don't double-add if it's already in globalCss (should be handled by extract)
					const scopedCss = this.processCssWithId(
						setting.css.trim(),
						setting.id,
					);
					const formattedCss = this.formatCss(scopedCss);
					cssBody += `\n\n${separator}\n${title}\n${separator}\n${formattedCss}`;
				}
			}
		} else {
			// Default: Cell format
			for (const setting of config.settings) {
				if (setting.css && setting.css.trim()) {
					const scopedCss = this.processCssWithId(
						setting.css.trim(),
						setting.id,
					);
					const formattedCss = this.formatCss(scopedCss);
					cssBody += `\n\n/* @cell: ${setting.id} */\n${formattedCss}\n/* @cell-end */`;
				}
			}
		}

		return `${settingsBlock}\n\n${cssBody}`;
	}

	private static formatCss(css: string): string {
		const lines = css.split("\n");
		let formatted: string[] = [];
		const indent = "    ";
		let depth = 0;

		for (let line of lines) {
			line = line.trim();
			if (!line) continue;

			let printIndent = depth;

			// If line starts with closing brace, shift back one level for printing
			if (line.startsWith("}")) {
				printIndent = Math.max(0, depth - 1);
			}

			formatted.push(indent.repeat(printIndent) + line);

			// Update depth based on braces in the line
			// Remove comments for brace counting to avoid false positives
			const cleanLine = line.replace(/\/\*.*?\*\//g, "");
			const openBraces = (cleanLine.match(/{/g) || []).length;
			const closeBraces = (cleanLine.match(/}/g) || []).length;

			depth += openBraces - closeBraces;

			// Safety check
			if (depth < 0) depth = 0;
		}
		return formatted.join("\n");
	}

	private static cleanSettings(settings: any[]) {
		for (const setting of settings) {
			delete setting.css;
			if (setting.settings) {
				this.cleanSettings(setting.settings);
			}
		}
	}

	static prependIdToSelectors(cssContent: string, id: string): string {
		const regex = /\/\* @settings([\s\S]*?)\*\//;
		const match = cssContent.match(regex);
		let cssStartIndex = 0;
		if (match) {
			cssStartIndex = match.index! + match[0].length;
		}

		const yamlPart = cssContent.substring(0, cssStartIndex);
		const cssPart = cssContent.substring(cssStartIndex);

		const processedCss = this.processCssWithId(cssPart, id);

		return yamlPart + processedCss;
	}

	private static processCssWithId(css: string, id: string): string {
		const wrapperClass = `.${id}`;
		let result = "";
		let buffer = "";
		let i = 0;

		// Context types: ROOT, CONTAINER (media/supports), PROTECTED (keyframes), BLOCK (style)
		let contextStack: string[] = ["ROOT"];

		const shouldPrefix = () => {
			const current = contextStack[contextStack.length - 1];
			return current === "ROOT" || current === "CONTAINER";
		};

		let inComment = false;
		let inString: string | null = null;

		while (i < css.length) {
			const char = css[i];

			// Handle Comments
			if (!inString && char === "/" && css[i + 1] === "*") {
				inComment = true;
				buffer += char;
				buffer += css[i + 1];
				i += 2;
				continue;
			}

			if (inComment) {
				buffer += char;
				if (char === "*" && css[i + 1] === "/") {
					buffer += css[i + 1];
					i++;
					inComment = false;
				}
				i++;
				continue;
			}

			// Handle Strings
			if (!inComment && (char === '"' || char === "'")) {
				if (!inString) {
					inString = char;
				} else if (inString === char && css[i - 1] !== "\\") {
					inString = null;
				}
				buffer += char;
				i++;
				continue;
			}

			if (inString) {
				buffer += char;
				i++;
				continue;
			}

			// Handle Blocks
			if (char === "{") {
				const cleanBuffer = buffer.replace(/\/\*[\s\S]*?\*\//g, "");
				const lastWordMatch = cleanBuffer.match(/@([\w-]+)[^{]*$/);

				let nextContext = "BLOCK";
				let isAtRule = false;

				if (lastWordMatch) {
					isAtRule = true;
					const atRuleName = lastWordMatch[1];
					if (
						["media", "supports", "container", "document"].includes(
							atRuleName,
						)
					) {
						nextContext = "CONTAINER";
					} else {
						nextContext = "PROTECTED";
					}
				}

				if (!isAtRule && shouldPrefix()) {
					const transformedBuffer = this.prefixSelectors(
						buffer,
						wrapperClass,
					);
					result += transformedBuffer;
				} else {
					result += buffer;
				}

				result += "{";
				buffer = "";
				contextStack.push(nextContext);
				i++;
				continue;
			}

			if (char === "}") {
				result += buffer + "}";
				buffer = "";
				if (contextStack.length > 1) {
					contextStack.pop();
				}
				i++;
				continue;
			}

			if (char === ";" && shouldPrefix()) {
				result += buffer + ";";
				buffer = "";
				i++;
				continue;
			}

			buffer += char;
			i++;
		}

		result += buffer;
		return result;
	}

	private static prefixSelectors(
		selectorText: string,
		wrapperClass: string,
	): string {
		const parts: string[] = [];
		let currentPart = "";
		let parenDepth = 0;

		for (let i = 0; i < selectorText.length; i++) {
			const char = selectorText[i];
			if (char === "(") parenDepth++;
			else if (char === ")") parenDepth--;
			else if (char === "," && parenDepth === 0) {
				parts.push(currentPart);
				currentPart = "";
				continue;
			}
			currentPart += char;
		}
		parts.push(currentPart);

		const processedParts = parts.map((part) => {
			const cleanPart = part.replace(/\/\*[\s\S]*?\*\//g, "").trim();
			if (!cleanPart) return part;

			if (cleanPart.startsWith(wrapperClass)) {
				const nextChar = cleanPart.substring(wrapperClass.length)[0];
				if (!nextChar || /[\s>+~.{[:#]/.test(nextChar)) {
					return part;
				}
			}

			let insertIdx = 0;
			for (let k = 0; k < part.length; k++) {
				if (/\s/.test(part[k])) continue;
				if (part[k] === "/" && part[k + 1] === "*") {
					const close = part.indexOf("*/", k + 2);
					if (close !== -1) {
						k = close + 1;
						continue;
					}
				}
				insertIdx = k;
				break;
			}

			if (insertIdx === 0 && part.trim().length === 0) return part;

			return (
				part.substring(0, insertIdx) +
				wrapperClass +
				" " +
				part.substring(insertIdx)
			);
		});

		return processedParts.join(",");
	}

	private static escapeRegExp(string: string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
}
