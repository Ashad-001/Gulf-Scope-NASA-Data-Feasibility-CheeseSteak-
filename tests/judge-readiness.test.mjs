import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Field Desk and Data Sources link to the content inside the provenance disclosure', async () => {
  const desk = await read('components/series-explorer.tsx');
  const sources = await read('app/(publication)/data-sources/page.tsx');
  const target = desk.match(/href="#([^"]+)">Provenance<\/a>/)?.[1];
  assert.ok(target);
  const disclosure = desk.match(/<details><summary>Source and archive provenance<\/summary>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(disclosure?.includes('id="' + target + '"'));
  assert.ok(sources.includes('href="/investigate?mode=series#' + target + '"'));
});

test('Native Bahrain server markup locks the selected month to the initial observation until hydration', async () => {
  const source = await read('components/bahrain-pilot.tsx');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const module = { exports: {} };
  const require = createRequire(import.meta.url);
  runInNewContext(outputText, { module, exports: module.exports, require(id) {
    if (id === 'next/dynamic') return () => () => null;
    if (id === 'next/link') return ({ children, href }) => createElement('a', { href }, children);
    return require(id);
  } });
  const pilot = JSON.parse(await read('data/atlas/bahrain/merra2-t2m-pilot.json'));
  const html = renderToStaticMarkup(createElement(module.exports.BahrainPilotView, { pilot, locations: [] }));
  assert.match(html, /<fieldset disabled=""><legend>Observation month<\/legend>/);
  const radios = html.match(/<input[^>]+type="radio"[^>]*>/g);
  assert.equal(radios?.length, 2);
  assert.match(radios[0], /\bchecked=""/);
  assert.doesNotMatch(radios[1], /\bchecked=/);
  assert.ok(html.includes('class="pilot-temperature">' + pilot.observations[0].celsius.toFixed(2)));
});
