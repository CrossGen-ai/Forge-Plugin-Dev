import { TFile, App } from 'obsidian';
import * as yaml from 'js-yaml';

export class FrontmatterWriter {
    constructor(private app: App) {}

    async writeFrontmatter(file: TFile, frontmatter: Record<string, any>): Promise<void> {
        try {
            if (frontmatter['atomic-task']) {
                console.log(`[TaskSystem] Writing frontmatter for atomic task:`, frontmatter);
            }
            const content = await this.app.vault.read(file);
            const yamlString = yaml.dump(frontmatter, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false,
                quotingType: '"',
                forceQuotes: false
            });

            let newContent: string;
            if (content.startsWith('---\n')) {
                // Replace existing frontmatter
                newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${yamlString}---`);
            } else {
                // Add new frontmatter
                newContent = `---\n${yamlString}---\n\n${content}`;
            }

            await this.app.vault.modify(file, newContent);
        } catch (error) {
            console.error('Failed to write frontmatter:', error);
            throw error;
        }
    }

    async updateFrontmatterField(file: TFile, fieldName: string, value: any): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            let frontmatter: Record<string, any> = {};

            if (frontmatterMatch) {
                frontmatter = yaml.load(frontmatterMatch[1]) as Record<string, any> || {};
            }

            frontmatter[fieldName] = value;
            await this.writeFrontmatter(file, frontmatter);
        } catch (error) {
            console.error(`Failed to update frontmatter field ${fieldName}:`, error);
            throw error;
        }
    }

    formatFrontmatterForDisplay(frontmatter: Record<string, any>): string {
        try {
            return yaml.dump(frontmatter, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
        } catch (error) {
            console.error('Failed to format frontmatter for display:', error);
            return JSON.stringify(frontmatter, null, 2);
        }
    }
}