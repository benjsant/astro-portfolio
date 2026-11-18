/**
 * Génère les PDF du CV (toutes les variantes) via un serveur `astro dev`
 * temporaire et Chromium (Playwright). Tourne DANS le conteneur `cv-pdf`
 * (image Playwright officielle, cf. docker-compose.yml) :
 *
 *   docker compose run --rm cv-pdf --private   (ou : pnpm cv:private)
 *     -> out-private/  AVEC le téléphone (CV_PHONE de .env.local)
 *   docker compose run --rm cv-pdf --public    (ou : pnpm cv:public)
 *     -> out-public/   SANS téléphone (CV_PHONE forcé à vide)
 *
 * Les deux dossiers sont ignorés par Git. La version privée est celle à
 * envoyer soi-même aux recruteurs ; elle ne doit jamais être publiée.
 *
 * Contrôles automatiques : 1 page par PDF, présence (privé) ou absence
 * (public) d'un lien tel: et d'un numéro dans le texte.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const mode = process.argv.includes('--private') ? 'private' : 'public';
const outDir = join(process.cwd(), `out-${mode}`);
const port = 4399; // distinct du serveur de dev habituel (4321)
const base = `http://127.0.0.1:${port}`;

// CV publics, toujours générés.
const pages = [
  ['CV_Benjamin_Santrisse_ATS', '/cv'],
  ['CV_Benjamin_Santrisse_Design', '/cv-design'],
];

// CV ciblés : jamais nommés ici. S'ils existent en local (non versionnés
// dans la branche publique), le serveur de dev expose leur liste sur
// /cv-local/variants.json ; sinon cette URL répond 404 et on s'en passe.
async function localVariants() {
  try {
    const res = await fetch(`${base}/cv-local/variants.json`);
    if (!res.ok) return [];
    const names = await res.json();
    return names.flatMap((name) => {
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      return [
        [`CV_Benjamin_Santrisse_${label}_ATS`, `/cv-local/${name}`],
        [`CV_Benjamin_Santrisse_${label}_Design`, `/cv-local/${name}-design`],
      ];
    });
  } catch {
    return [];
  }
}

// Numéro FR (06 12 34 56 78, 0612345678, +33 6…) dans un texte.
const PHONE_RE = /(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/;

// Version publique : CV_PHONE forcé à vide (les variables du processus
// priment sur .env.local). Version privée : valeur de .env.local.
const env = { ...process.env };
if (mode === 'public') env.CV_PHONE = '';

const astroBin = join(process.cwd(), 'node_modules', '.bin', 'astro');
// --ignore-lock : ce serveur temporaire n'écrit pas .astro/dev.json (partagé
// avec le conteneur de dev via le volume). Sinon, un verrou orphelin empêche
// ensuite `astro dev` de redémarrer (« Another astro dev server is already running »).
const server = spawn(astroBin, ['dev', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'], {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

function stopServer() {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* déjà arrêté */
  }
}

async function waitForServer(timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/cv`);
      if (res.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`astro dev n'a pas démarré sur ${base}.\n${serverLog}`);
}

let failed = false;
let browser;
try {
  await waitForServer();
  pages.push(...(await localVariants()));
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(`Chromium introuvable : lance ce script via « docker compose run --rm cv-pdf ».\n${err.message}`);
  }
  mkdirSync(outDir, { recursive: true });
  const page = await browser.newPage();

  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // L'email est assemblé côté client (anti-scraping) : on attend le mailto:.
    await page.waitForSelector('a.email-link[href^="mailto:"]');

    const telLinks = await page.locator('a[href^="tel:"]').count();
    // Feuille du CV : .cv-sheet (ATS) ou .cvd-paper (design).
    const sheetText = await page.locator('.cv-sheet, .cvd-paper').first().innerText();
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

    const file = join(outDir, `${name}.pdf`);
    writeFileSync(file, pdf);

    const problems = [];
    if (pageCount !== 1) problems.push(`${pageCount} pages au lieu d'1`);
    if (mode === 'public' && (telLinks > 0 || PHONE_RE.test(sheetText))) {
      problems.push('TÉLÉPHONE PRÉSENT dans la version publique');
    }
    if (mode === 'private' && telLinks === 0) {
      problems.push('aucun téléphone : renseigne CV_PHONE dans .env.local');
    }
    if (problems.length) failed = true;
    process.stdout.write(`${problems.length ? '✗' : '✓'} ${file}${problems.length ? '  -> ' + problems.join(', ') : ''}\n`);
  }
} catch (err) {
  failed = true;
  console.error(err.message);
} finally {
  await browser?.close();
  stopServer();
}

process.exit(failed ? 1 : 0);
