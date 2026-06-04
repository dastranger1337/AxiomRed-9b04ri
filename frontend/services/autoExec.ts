// Auto-execute helpers: extract runnable code blocks from AI responses
// and run them against the local container runtime.

const EXEC_LANGS = new Set([
  'bash', 'sh', 'shell',
  'python', 'python3', 'py',
  'javascript', 'js', 'node',
  'typescript', 'ts',
  'go',
  'ruby',
  'c', 'cpp', 'c++',
  'php',
  'perl',
  'lua',
  'powershell', 'ps1',
  'rust',
]);

const LANG_ALIAS: Record<string, string> = {
  shell: 'bash',
  py: 'python',
  js: 'javascript',
  'c++': 'cpp',
  ps1: 'powershell',
};

export interface RunnableBlock {
  lang: string;
  code: string;
}

/** Extract every runnable fenced code block from a markdown string. */
export function extractRunnableBlocks(markdown: string): RunnableBlock[] {
  if (!markdown) return [];
  const blocks: RunnableBlock[] = [];
  const re = /```([a-zA-Z0-9+_-]*)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const rawLang = (m[1] || 'bash').toLowerCase();
    const lang = LANG_ALIAS[rawLang] || rawLang;
    if (!EXEC_LANGS.has(lang) && rawLang !== '') continue;
    const code = m[2].trim();
    if (!code) continue;
    blocks.push({ lang: lang || 'bash', code });
  }
  return blocks;
}

export interface ExecResult {
  lang: string;
  code: string;
  output: string;
  exitCode: number;
  durationMs: number;
  success: boolean;
}

/** POST to the local runtime to execute one code block. */
export async function runCode(code: string, lang: string, timeoutSec = 180): Promise<ExecResult> {
  const runtimeBase =
    process.env.EXPO_PUBLIC_AXIOM_RUNTIME_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';

  const res = await fetch(`${runtimeBase}/api/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: lang, code, timeout: timeoutSec }),
  });

  let data: any = {};
  try { data = await res.json(); } catch { /* ignore */ }

  return {
    lang,
    code,
    output: data.output || data.stderr || data.error || '(no output)',
    exitCode: typeof data.exitCode === 'number' ? data.exitCode : -1,
    durationMs: data.durationMs || 0,
    success: !!data.success,
  };
}

/** Format multiple ExecResults as a markdown report to feed back into the chat. */
export function formatExecResults(results: ExecResult[]): string {
  if (!results.length) return '';
  const lines: string[] = [];
  lines.push('## ⚙️  Auto-Exec Results');
  lines.push('');
  results.forEach((r, i) => {
    const status = r.success ? '✓ exit 0' : `✗ exit ${r.exitCode}`;
    lines.push(`### Step ${i + 1} · \`${r.lang}\` · ${status} · ${r.durationMs}ms`);
    lines.push('```' + r.lang);
    lines.push(r.code);
    lines.push('```');
    lines.push('**Output:**');
    lines.push('```');
    // Cap each output at 8 KB so we don't blow the context window
    const capped = r.output.length > 8000
      ? r.output.slice(0, 8000) + `\n... (truncated, ${r.output.length - 8000} more chars)`
      : r.output;
    lines.push(capped);
    lines.push('```');
    lines.push('');
  });
  return lines.join('\n');
}
