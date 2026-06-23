// Keepvidya Office — Writer (rich-text document editor).
import { icons } from './icons.js';
import { el, toast } from './main.js';
import { downloadFile } from './store.js';

export function mountWriter(host, file, ctx) {
  const data = file.data && file.data.html ? file.data : { html: '<h1>Untitled document</h1><p></p>' };

  const page = el('div', { class: 'page', contenteditable: 'true', spellcheck: 'true' });
  page.innerHTML = data.html;

  const cmd = (c, v = null) => { page.focus(); document.execCommand(c, false, v); sync(); refreshState(); };

  // toolbar
  const tb = (ic, title, on, isToggle) => el('button', { class: 'tb', title, html: ic, 'data-tog': isToggle ? title.toLowerCase() : null, onclick: on });
  const styleSel = el('select', { class: 'tbsel', title: 'Paragraph style', onchange: () => cmd('formatBlock', styleSel.value) }, [
    optionEl('p', 'Body'), optionEl('h1', 'Title'), optionEl('h2', 'Heading'), optionEl('h3', 'Subheading'), optionEl('blockquote', 'Quote'), optionEl('pre', 'Code'),
  ]);
  const sizeSel = el('select', { class: 'tbsel', title: 'Font size', onchange: () => cmd('fontSize', sizeSel.value) },
    [['2', 'Small'], ['3', 'Normal'], ['4', 'Large'], ['5', 'X-Large'], ['6', 'Huge']].map(([v, l]) => optionEl(v, l, v === '3')));
  const color = el('input', { class: 'tbcolor', type: 'color', title: 'Text colour', value: '#1B2A33', oninput: () => cmd('foreColor', color.value) });

  const toolbar = el('div', { class: 'tbar' }, [
    el('div', { class: 'grp' }, [
      tb(icons.undo, 'Undo', () => cmd('undo')),
      tb(icons.redo, 'Redo', () => cmd('redo')),
    ]),
    el('div', { class: 'grp' }, [styleSel, sizeSel]),
    el('div', { class: 'grp' }, [
      tb(icons.bold, 'Bold', () => cmd('bold'), true),
      tb(icons.italic, 'Italic', () => cmd('italic'), true),
      tb(icons.underline, 'Underline', () => cmd('underline'), true),
      color,
    ]),
    el('div', { class: 'grp' }, [
      tb(icons.alignL, 'Align left', () => cmd('justifyLeft')),
      tb(icons.alignC, 'Align centre', () => cmd('justifyCenter')),
      tb(icons.alignR, 'Align right', () => cmd('justifyRight')),
    ]),
    el('div', { class: 'grp' }, [
      tb(icons.ul, 'Bulleted list', () => cmd('insertUnorderedList')),
      tb(icons.ol, 'Numbered list', () => cmd('insertOrderedList')),
      tb(icons.quote, 'Quote', () => cmd('formatBlock', 'blockquote')),
      tb(icons.link, 'Insert link', () => { const u = prompt('Link URL:', 'https://'); if (u) cmd('createLink', u); }),
    ]),
  ]);

  const status = el('div', { class: 'w-status' });
  const scroll = el('div', { class: 'w-scroll' }, [page]);
  host.append(toolbar, scroll, status);

  function counts() {
    const text = page.innerText.replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    status.innerHTML = `<span>${words} word${words === 1 ? '' : 's'}</span><span>${text.length} characters</span><span>~${Math.max(1, Math.ceil(words / 200))} min read</span>`;
  }
  const sync = () => { ctx.save({ html: page.innerHTML }); counts(); };
  function refreshState() {
    toolbar.querySelectorAll('[data-tog]').forEach(b => {
      try { b.classList.toggle('on', document.queryCommandState(b.getAttribute('data-tog'))); } catch {}
    });
  }
  page.addEventListener('input', sync);
  page.addEventListener('keyup', refreshState);
  page.addEventListener('mouseup', refreshState);
  counts();

  // ---- exporters ----
  const fullHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(file.name)}</title>
<style>body{font-family:'Source Serif 4',Georgia,serif;max-width:740px;margin:48px auto;padding:0 24px;line-height:1.65;color:#1B2A33}h1,h2,h3{font-family:'Source Sans 3',system-ui,sans-serif}blockquote{border-left:3px solid #C0703C;padding-left:16px;color:#4A5C65;font-style:italic}</style>
</head><body>${page.innerHTML}</body></html>`;

  const exports = [
    { label: 'HTML (.html)', icon: icons.writer, run: () => { downloadFile(fname('html'), fullHtml(), 'text/html'); toast('Exported HTML'); } },
    { label: 'Markdown (.md)', icon: icons.writer, run: () => { downloadFile(fname('md'), htmlToMarkdown(page), 'text/markdown'); toast('Exported Markdown'); } },
    { label: 'Plain text (.txt)', icon: icons.writer, run: () => { downloadFile(fname('txt'), page.innerText, 'text/plain'); toast('Exported text'); } },
    { label: 'Print / PDF', icon: icons.print, hint: '⌘P', run: () => window.print() },
  ];
  function fname(ext) { return (file.name || 'document').replace(/[^\w.-]+/g, '_') + '.' + ext; }

  return { destroy() {}, exports };
}

function optionEl(v, label, sel) { const o = el('option', { value: v, text: label }); if (sel) o.selected = true; return o; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// Lightweight HTML → Markdown (covers the editor's output: headings, lists, bold/italic, links, quotes).
function htmlToMarkdown(rootEl) {
  const lines = [];
  const inline = (node) => {
    let s = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { s += n.textContent; return; }
      const t = n.tagName?.toLowerCase();
      const inner = inline(n);
      if (t === 'b' || t === 'strong') s += `**${inner}**`;
      else if (t === 'i' || t === 'em') s += `*${inner}*`;
      else if (t === 'u') s += inner;
      else if (t === 'a') s += `[${inner}](${n.getAttribute('href') || ''})`;
      else if (t === 'br') s += '\n';
      else s += inner;
    });
    return s;
  };
  const block = (node, prefix = '') => {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { if (n.textContent.trim()) lines.push(n.textContent.trim()); return; }
      const t = n.tagName?.toLowerCase();
      if (t === 'h1') lines.push('# ' + inline(n));
      else if (t === 'h2') lines.push('## ' + inline(n));
      else if (t === 'h3') lines.push('### ' + inline(n));
      else if (t === 'blockquote') lines.push('> ' + inline(n).replace(/\n/g, '\n> '));
      else if (t === 'pre') lines.push('```\n' + n.innerText + '\n```');
      else if (t === 'ul') { n.querySelectorAll(':scope>li').forEach(li => lines.push('- ' + inline(li))); }
      else if (t === 'ol') { let i = 1; n.querySelectorAll(':scope>li').forEach(li => lines.push(`${i++}. ` + inline(li))); }
      else if (t === 'p' || t === 'div') lines.push(inline(n));
      else block(n, prefix);
      if (['h1', 'h2', 'h3', 'p', 'div', 'blockquote', 'ul', 'ol', 'pre'].includes(t)) lines.push('');
    });
  };
  block(rootEl);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
