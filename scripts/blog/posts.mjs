// Lectura y validación de los artículos del blog (content/blog/*.md). Sin dependencias de render: lo usan blog.mjs y seo.mjs.
//
// Cada artículo empieza con un encabezado entre «---»:
//   titulo: Lo que sí debes saber de tu dominio
//   descripcion: Una o dos frases para buscadores y redes (máx. 160 caracteres)
//   fecha: 2026-11-20            (AAAA-MM-DD)
//   slug: dominio-que-debes-saber   (opcional: si falta sale del nombre del archivo sin la fecha)
//   actualizado: 2026-12-02      (opcional)
//   noindex: si                  (opcional: pide a los buscadores no indexarlo; no sale en la portada del blog ni en el sitemap. Para pruebas)
// Los archivos que empiezan con «_» (como _plantilla.md) no se publican. Los borradores viven en private/blog/.

import fs from 'node:fs';
import path from 'node:path';
import { mdAPalabras } from './markdown.mjs';

export const BLOG_DIR = 'content/blog';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const fechaLarga = (iso) => { const [a, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };

export function parsearPost(texto, archivo = '') {
  const m = String(texto).replace(/^﻿/, '').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { ok: false, error: `${archivo}: falta el encabezado entre ---` };
  const meta = {};
  for (const l of m[1].split('\n')) { const k = l.match(/^([a-z]+):\s*(.*)$/i); if (k) meta[k[1].toLowerCase()] = k[2].trim(); }
  const errores = [];
  const slug = meta.slug || path.basename(archivo, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errores.push('slug: solo minúsculas, números y guiones');
  if (!meta.titulo || meta.titulo.length > 110) errores.push('titulo: obligatorio (máx. 110)');
  if (!meta.descripcion || meta.descripcion.length > 160) errores.push('descripcion: obligatoria (máx. 160)');
  const fecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && !Number.isNaN(Date.parse(s));
  if (!fecha(meta.fecha)) errores.push('fecha: AAAA-MM-DD');
  if (meta.actualizado && !fecha(meta.actualizado)) errores.push('actualizado: AAAA-MM-DD');
  const cuerpo = m[2].trim();
  if (!cuerpo) errores.push('sin contenido');
  if (errores.length) return { ok: false, error: `${archivo}: ${errores.join('; ')}` };
  return { ok: true, slug, titulo: meta.titulo, descripcion: meta.descripcion, fecha: meta.fecha, actualizado: meta.actualizado ?? '', noindex: /^(si|sí|true)$/i.test(meta.noindex ?? ''), cuerpo, minutos: Math.max(1, Math.round(mdAPalabras(cuerpo) / 200)) };
}

export function leerPosts(dir = BLOG_DIR) {
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !x.startsWith('_')).sort()) {
    const p = parsearPost(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    if (!p.ok) throw new Error(p.error);
    posts.push(p);
  }
  const vistos = new Set();
  for (const p of posts) { if (vistos.has(p.slug)) throw new Error(`slug repetido: ${p.slug}`); vistos.add(p.slug); }
  return posts.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.slug.localeCompare(b.slug));
}

