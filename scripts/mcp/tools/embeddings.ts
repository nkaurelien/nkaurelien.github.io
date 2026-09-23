import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);
const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/import-projects-supabase.js');

export async function syncEmbeddings(options?: { projectId?: string }): Promise<{ success: boolean; output: string }> {
  try {
    const env = {
      ...process.env,
      PROJECT_FILTER: options?.projectId || '',
    };

    const { stdout, stderr } = await execPromise(`node "${SCRIPT_PATH}"`, {
      cwd: process.cwd(),
      env,
      timeout: 120000,
    });

    return {
      success: true,
      output: (stdout + (stderr ? `\nWarnings: ${stderr}` : '')).trim(),
    };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(`Échec de la synchronisation des embeddings : ${err.stderr || err.stdout || err.message}`);
  }
}
