import {test as base, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {lessons, assignments, pythonStarter} from '../../src/content.js';

const STORAGE = 'attention-lab:v1';
// Fixed pre-migration format, deliberately independent of production serializers.
const legacy = JSON.parse(readFileSync(new URL('../fixtures/storage-v1.json', import.meta.url)));
const test = base.extend({
  browserErrors: [async ({page}, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    page.on('response', response => {if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(request.failure()?.errorText);
    });
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:4173/')) errors.push(`Unexpected external dependency: ${request.url()}`);
    });
    await use(errors);
    expect(errors, 'No JS, formula, resource-loading or external dependency errors').toEqual([]);
  }, {auto:true}]
});

const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);
async function downloadText(download) {
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
async function seed(context, raw = JSON.stringify(legacy)) {
  await context.addInitScript(({key, raw}) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  }, {key:STORAGE, raw});
}

test('all ten lessons render math and all thirty answers update persistent progress', async ({page}) => {
  for (const lesson of lessons) {
    await page.goto(`./#lesson/${lesson.id}`);
    await expect(page.locator('h1')).toHaveText(lesson.title);
    await expect(page.locator('#main .katex').first()).toBeVisible();
    await expect(page.locator('.katex-error')).toHaveCount(0);
    await page.locator('[data-action="mark-read"]').click();
    for (const [i, question] of lesson.checks.entries()) {
      const input = page.locator(`[name="q-${lesson.id}-${i}"]`);
      if (question[1]) await input.nth(question[2]).check();
      else await input.fill(String(question[2]));
    }
    await page.locator('[data-action="submit-quiz"]').click();
    await expect(page.locator('#quiz-summary')).toContainText('3 / 3');
    await expect(page.locator('#quiz .feedback.correct')).toHaveCount(3);
  }
  await page.reload();
  await expect(page.locator('.journey-box')).toContainText('10 / 10');
  const record = await stored(page);
  expect(record.version).toBe(1);
  expect(record.data.read).toEqual([0,1,2,3,4,5,6,7,8,9]);
  expect(record.data.attempts).toHaveLength(10);
});

test('wrong answers enter review and a corrected attempt removes them', async ({page}) => {
  await page.goto('./#practice/0');
  await page.locator('[name="q-0-0"][value="1"]').check();
  await page.locator('[name="q-0-1"]').fill('0.5');
  await page.locator('[name="q-0-2"][value="0"]').check();
  await page.locator('[data-action="submit-quiz"]').click();
  await expect(page.locator('#quiz-summary')).toContainText('2 / 3');
  await page.goto('./#practice/wrong');
  await expect(page.locator('.question')).toHaveCount(1);
  await page.locator('[name="q-0-0"][value="0"]').check();
  await page.locator('[data-action="submit-quiz"]').click();
  await page.reload();
  await expect(page.locator('#quiz')).toContainText('这里暂时没有错题');
});

test('four labs respond to controls with numerical outcomes', async ({page}) => {
  await page.goto('./#labs/attention');
  await expect(page.locator('.cell')).toHaveCount(16);
  const weights = await page.locator('.cell').allTextContents();
  const output = await page.locator('.output-vector').textContent();
  await page.locator('#vx').press('End');
  expect(await page.locator('.cell').allTextContents()).toEqual(weights);
  await expect(page.locator('.output-vector')).not.toHaveText(output);
  await page.locator('#causal').check();
  await expect(page.locator('.cell.masked')).toHaveCount(6);
  expect(await page.locator('.cell.masked').allTextContents()).toEqual(Array(6).fill('0.00'));
  await expect(page.locator('.cell').first()).toHaveText('1.00');
  await page.locator('#head-select').selectOption('1');
  await page.locator('[data-action="reset-lab"]').click();
  expect(await page.locator('.cell').allTextContents()).toEqual(weights);

  await page.goto('./#labs/position');
  await page.locator('#pos').press('Home');
  expect(await page.locator('#lab-output .vector-item strong').allTextContents()).toEqual(['0.0000','1.0000','0.0000','1.0000','0.0000','1.0000','0.0000','1.0000']);
  await page.locator('#dim-select').selectOption('16');
  await expect(page.locator('#lab-output .vector-item')).toHaveCount(16);
  await page.locator('#pos').press('ArrowRight');
  await expect(page.locator('#lab-output .vector-item strong').first()).toHaveText('0.8415');

  await page.goto('./#labs/shape');
  await page.locator('#model-select').selectOption('96');
  await page.locator('#heads').press('ArrowRight'); // 4 -> 5, invalid division
  await expect(page.locator('#lab-output')).toContainText('这个组合无法等宽分头');
  await page.locator('#heads').press('ArrowRight'); // 5 -> 6
  await expect(page.locator('.shape-box')).toHaveCount(8);
  await expect(page.locator('.shape-box').nth(1).locator('annotation')).toHaveText('(2, 6, 8, 16)');

  await page.goto('./#labs/decode');
  await page.locator('#topk').press('Home');
  expect(await page.locator('.bar-row strong').allTextContents()).toEqual(['100.0%','0.0%','0.0%','0.0%']);
  for (let i=0; i<3; i++) await page.locator('[data-action="sample"]').click();
  expect(await page.locator('#lab-output .token-buttons .tag').allTextContents()).toEqual(Array(3).fill('Transformer'));
  await page.locator('[data-action="clear-samples"]').click();
  await expect(page.locator('#lab-output .token-buttons .tag')).toHaveCount(0);
  expect((await stored(page)).data.labVisits).toEqual(['attention','position','shape','decode']);
  await expect(page.locator('.katex-error')).toHaveCount(0);
});

test('legacy v1 progress, notes, attempts and assignment drafts survive load and reload', async ({page, context}) => {
  await seed(context);
  await page.goto('./#home');
  await expect(page.locator('.journey-box')).toContainText('1 / 10');
  expect(await stored(page)).toEqual(legacy);
  await page.goto('./#notes/nlegacy-1');
  await expect(page.locator('#note-title')).toHaveValue(legacy.data.notes[0].title);
  await expect(page.locator('#note-body')).toHaveValue(legacy.data.notes[0].body);
  await page.goto('./#assignment/2');
  await expect(page.locator('#work-body')).toHaveValue(legacy.data.work[2].body);
  await expect(page.locator('[data-work-check="2"]').nth(0)).toBeChecked();
  await expect(page.locator('[data-work-check="2"]').nth(1)).not.toBeChecked();
  await page.reload();
  expect(await stored(page)).toEqual(legacy);
});

test('notes autosave, render LaTeX, search, export and delete through confirmation', async ({page}) => {
  await page.goto('./#notes');
  await page.locator('[data-action="new-note"]').first().click();
  await page.locator('#note-title').fill('我的注意力笔记');
  const body = String.raw`公式 \(QK^{\mathsf T}\) 与 <script>普通文字</script>`;
  await page.locator('#note-body').fill(body);
  await page.locator('#note-lesson').selectOption('4');
  await page.reload();
  await expect(page.locator('#note-body')).toHaveValue(body);
  await expect(page.locator('#note-lesson')).toHaveValue('4');
  await page.locator('[data-action="preview-note"]').click();
  await expect(page.locator('#note-preview .katex')).toBeVisible();
  await expect(page.locator('#note-preview script')).toHaveCount(0);
  await page.locator('#note-search').fill('不存在的标题');
  await expect(page.locator('#note-items .note-item')).toHaveCount(0);
  await page.locator('#note-search').fill('注意力');
  await expect(page.locator('#note-items a')).toHaveCount(1);
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export-note"]').click();
  expect(await downloadText(await downloaded)).toContain(body);
  await page.locator('[data-action="delete-note"]').click();
  await expect(page.locator('#modal')).toBeVisible();
  expect((await stored(page)).data.notes).toHaveLength(1);
  await page.locator('[data-action="confirm-delete-note"]').click();
  await page.reload();
  expect((await stored(page)).data.notes).toEqual([]);
});

test('all four assignments save drafts and self-assessment; reference script downloads intact', async ({page}) => {
  for (const assignment of assignments) {
    await page.goto(`./#assignment/${assignment.id}`);
    await expect(page.locator('h1')).toHaveText(assignment.title);
    const text = '我的推导与实验记录：每个计算步骤、形状和数值都经过独立核对。'.repeat(2);
    await page.locator('#work-body').fill(text);
    for (const box of await page.locator('[data-work-check]').all()) await box.check();
    await page.locator('[data-action="submit-work"]').click();
    await expect(page.locator('#work-status')).toContainText('自评提交');
    await page.reload();
    await expect(page.locator('#work-body')).toHaveValue(text);
    expect((await stored(page)).data.work[assignment.id].submitted).toBeTruthy();
  }
  await page.goto('./#assignment/2');
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="download-python"]').click();
  expect(await downloadText(await downloaded)).toBe(pythonStarter);
});

test('backup export/import preserves v1 schema and does not replace data until confirmed', async ({page, context}) => {
  await seed(context);
  await page.goto('./#settings');
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export-all"]').click();
  const backup = JSON.parse(await downloadText(await downloaded));
  expect(backup).toMatchObject({app:'attention-lab', version:1, data:legacy.data});
  expect(Number.isFinite(Date.parse(backup.exportedAt))).toBe(true);
  await page.goto('./#notes');
  await page.locator('[data-action="new-note"]').first().click();
  await page.locator('#note-title').fill('备份后新建');
  const beforeImport = await stored(page);
  await page.goto('./#settings');
  await page.locator('#import-file').setInputFiles({name:'backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#modal')).toBeVisible();
  expect(await stored(page)).toEqual(beforeImport);
  await page.locator('[data-action="confirm-import"]').click();
  await page.reload();
  expect(await stored(page)).toEqual(legacy);
  await page.locator('#import-file').setInputFiles({name:'invalid.json', mimeType:'application/json', buffer:Buffer.from('{"app":"other","version":1}')});
  await expect(page.locator('#toast')).toContainText('无法导入');
  expect(await stored(page)).toEqual(legacy);
});

test('unreadable existing storage is preserved and can be exported', async ({page, context}) => {
  const broken = '{broken-v1-record';
  await seed(context, broken);
  await page.goto('./#settings');
  await expect(page.locator('.notice')).toContainText('已有本地记录无法读取');
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export-raw"]').click();
  expect(await downloadText(await downloaded)).toBe(broken);
  await page.goto('./#lesson/0');
  expect(await page.evaluate(key=>localStorage.getItem(key), STORAGE)).toBe(broken);
});

test('another tab cannot silently overwrite newer learning data', async ({page, context}) => {
  await seed(context);
  await page.goto('./#notes/nlegacy-1');
  const other = await context.newPage();
  await other.goto(page.url());
  await other.locator('#note-body').fill('另一个标签页的新内容');
  await expect(page.locator('#storage-status')).toContainText('本地保存不可用');
  await page.locator('#note-body').fill('旧标签页的改动');
  expect((await stored(page)).data.notes[0].body).toBe('另一个标签页的新内容');
  await page.reload();
  await expect(page.locator('#note-body')).toHaveValue('另一个标签页的新内容');
});

test('navigation, search, mobile menu and both GitHub Star entries remain usable', async ({page}) => {
  await page.goto('./');
  for (const selector of ['.github-star', '.footer-star']) {
    await expect(page.locator(selector)).toHaveAttribute('href', 'https://github.com/jeezliu/attention-lab');
    await expect(page.locator(selector)).toHaveAttribute('target', '_blank');
    await expect(page.locator(selector)).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await page.locator('[data-action="search"]').click();
  await page.locator('#course-search').fill('Q、K、V');
  await page.locator('#course-results a').first().click();
  await expect(page.locator('h1')).toHaveText('Q、K、V 到底是什么');
  await expect(page.locator('#modal')).not.toBeVisible();
  await page.setViewportSize({width:390, height:844});
  await page.locator('[data-action="menu"]').click();
  await expect(page.locator('[data-action="menu"]')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#sidebar a[href="#courses"]').click();
  await expect(page.locator('.lesson-row')).toHaveCount(10);
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  await page.goto('./#resources');
  await expect(page.locator('h1')).toBeVisible();
  // Require actual local KaTeX font loading, not only generated HTML markup.
  await page.goto('./#lesson/4');
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>[...document.fonts].some(font=>font.family.includes('KaTeX') && font.status==='loaded'))).toBe(true);
});
