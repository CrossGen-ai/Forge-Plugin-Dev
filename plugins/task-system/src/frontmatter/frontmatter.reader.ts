import { TFile, App } from 'obsidian';
import * as yaml from 'js-yaml';

export class FrontmatterReader {
    constructor(private app: App) {}

    async readFrontmatter(file: TFile): Promise<Record<string, any> | null> {
        try {
            const content = await this.app.vault.read(file);
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (!frontmatterMatch) return null;

            const parsed = yaml.load(frontmatterMatch[1]) as Record<string, any>;
            return parsed || null;
        } catch (error) {
            console.error('Failed to read frontmatter:', error);
            return null;
        }
    }

    isAtomicNote(frontmatter: Record<string, any>): boolean {
        return frontmatter?.['atomic-task'] === true;
    }

    async isFileAtomicNote(file: TFile): Promise<boolean> {
        const frontmatter = await this.readFrontmatter(file);
        return frontmatter ? this.isAtomicNote(frontmatter) : false;
    }

    extractFrontmatterFromContent(content: string): { frontmatter: Record<string, any> | null, contentWithoutFrontmatter: string } {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);

        if (!frontmatterMatch) {
            return { frontmatter: null, contentWithoutFrontmatter: content };
        }

        try {
            const frontmatter = yaml.load(frontmatterMatch[1]) as Record<string, any>;
            const contentWithoutFrontmatter = frontmatterMatch[2] || '';
            return { frontmatter: frontmatter || null, contentWithoutFrontmatter };
        } catch (error) {
            console.error('Failed to parse frontmatter:', error);
            return { frontmatter: null, contentWithoutFrontmatter: content };
        }
    }
}