import { readFile, writeFile, rename, unlink, readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import { ToolDefinition, ToolResult } from './types';

const CONFIRM_REQUIRED_PATTERNS = [/delete/i, /remove/i, /rm/i, /overwrite/i];

export class FileTools {
  private workingDir: string;
  private requireConfirm: boolean;

  constructor(workingDir?: string, requireConfirm = true) {
    this.workingDir = workingDir || process.cwd();
    this.requireConfirm = requireConfirm;
  }

  private resolvePath(filePath: string): string {
    return resolve(this.workingDir, filePath);
  }

  needsConfirmation(action: string): boolean {
    return this.requireConfirm && CONFIRM_REQUIRED_PATTERNS.some(p => p.test(action));
  }

  async read(filePath: string): Promise<ToolResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) return { success: false, error: `File not found: ${filePath}` };
      const content = await readFile(fullPath, 'utf-8');
      const ext = filePath.split('.').pop() || '';
      return { success: true, data: { path: filePath, content, language: ext } };
    } catch (error) {
      return { success: false, error: `Failed to read ${filePath}: ${error}` };
    }
  }

  async write(filePath: string, content: string): Promise<ToolResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      const dir = fullPath.replace(/\/[^/]+$/, '');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
      return { success: true, data: { path: filePath, size: content.length } };
    } catch (error) {
      return { success: false, error: `Failed to write ${filePath}: ${error}` };
    }
  }

  async edit(filePath: string, oldText: string, newText: string): Promise<ToolResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) return { success: false, error: `File not found: ${filePath}` };
      let content = await readFile(fullPath, 'utf-8');
      if (!content.includes(oldText)) return { success: false, error: `Text not found in ${filePath}` };
      content = content.replace(oldText, newText);
      await writeFile(fullPath, content, 'utf-8');
      return { success: true, data: { path: filePath } };
    } catch (error) {
      return { success: false, error: `Failed to edit ${filePath}: ${error}` };
    }
  }

  async rename(oldPath: string, newPath: string): Promise<ToolResult> {
    try {
      const fullOldPath = this.resolvePath(oldPath);
      const fullNewPath = this.resolvePath(newPath);
      if (!existsSync(fullOldPath)) return { success: false, error: `File not found: ${oldPath}` };
      const dir = fullNewPath.replace(/\/[^/]+$/, '');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      await rename(fullOldPath, fullNewPath);
      return { success: true, data: { from: oldPath, to: newPath } };
    } catch (error) {
      return { success: false, error: `Failed to rename ${oldPath}: ${error}` };
    }
  }

  async delete(filePath: string): Promise<ToolResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) return { success: false, error: `File not found: ${filePath}` };
      await unlink(fullPath);
      return { success: true, data: { path: filePath } };
    } catch (error) {
      return { success: false, error: `Failed to delete ${filePath}: ${error}` };
    }
  }

  async list(dirPath: string): Promise<ToolResult> {
    try {
      const fullPath = this.resolvePath(dirPath);
      if (!existsSync(fullPath)) return { success: false, error: `Directory not found: ${dirPath}` };
      const entries = await readdir(fullPath);
      const files = [];
      for (const entry of entries) {
        const entryPath = join(fullPath, entry);
        const s = await stat(entryPath);
        files.push({ name: entry, type: s.isDirectory() ? 'directory' : 'file', size: s.size });
      }
      return { success: true, data: { path: dirPath, files } };
    } catch (error) {
      return { success: false, error: `Failed to list ${dirPath}: ${error}` };
    }
  }

  async searchFile(pattern: string, dirPath?: string): Promise<ToolResult> {
    try {
      const { execSync } = await import('child_process');
      const searchDir = dirPath || this.workingDir;
      const result = execSync(`rg -l "${pattern}" "${searchDir}" --no-heading 2>/dev/null`, { encoding: 'utf-8', timeout: 10000 });
      const files = result.trim().split('\n').filter(Boolean);
      return { success: true, data: { pattern, files } };
    } catch {
      return { success: true, data: { pattern, files: [] } };
    }
  }

  toToolDefinitions(): ToolDefinition[] {
    const self = this;
    return [
      { name: 'read_file', description: 'Read file contents from the project', category: 'file', parameters: { path: { type: 'string', description: 'File path relative to project root', required: true } }, execute: (args) => self.read(args.path as string) },
      { name: 'write_file', description: 'Write content to a file (creates directories if needed)', category: 'file', parameters: { path: { type: 'string', description: 'File path', required: true }, content: { type: 'string', description: 'File content', required: true } }, execute: (args) => self.write(args.path as string, args.content as string) },
      { name: 'edit_file', description: 'Replace text in a file', category: 'file', parameters: { path: { type: 'string', description: 'File path', required: true }, old_text: { type: 'string', description: 'Text to replace', required: true }, new_text: { type: 'string', description: 'Replacement text', required: true } }, execute: (args) => self.edit(args.path as string, args.old_text as string, args.new_text as string) },
      { name: 'rename_file', description: 'Rename or move a file', category: 'file', parameters: { old_path: { type: 'string', description: 'Current path', required: true }, new_path: { type: 'string', description: 'New path', required: true } }, execute: (args) => self.rename(args.old_path as string, args.new_path as string) },
      { name: 'delete_file', description: 'Delete a file', category: 'file', parameters: { path: { type: 'string', description: 'File path to delete', required: true } }, execute: (args) => self.delete(args.path as string) },
      { name: 'list_dir', description: 'List files in a directory', category: 'file', parameters: { path: { type: 'string', description: 'Directory path', required: true } }, execute: (args) => self.list(args.path as string) },
      { name: 'search_files', description: 'Search for files matching a pattern using ripgrep', category: 'search', parameters: { pattern: { type: 'string', description: 'Search pattern', required: true }, path: { type: 'string', description: 'Directory to search (optional)' } }, execute: (args) => self.searchFile(args.pattern as string, args.path as string | undefined) },
    ];
  }
}
