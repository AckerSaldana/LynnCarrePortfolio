# Imágenes de proyectos

Dos usos, dos lugares:

## 1) Mosaico de la PORTADA — archivos sueltos aquí

Suelta fotos directamente en esta carpeta (`projects/`). Alimentan el mosaico diagonal de
la portada (optimizadas a webp por Astro). Sirve cualquier obra, tenga o no modelo 3D.

- Formatos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
- El nombre = slug del proyecto (sin acentos, minúsculas): `bouquet.jpg`, `expo-ingenierias.jpg`, …
- El slug también se usa como respaldo para la foto principal del detalle y el hover del título.

## 2) Vista DETALLADA de cada proyecto — subcarpeta por proyecto

Las fotos de la vista detallada (galería + foto principal) van en una **subcarpeta con el
slug del proyecto**:

```
projects/
  bouquet/      01.jpg  02.jpg  03.jpg  …   ← galería del detalle de Bouquet
  biznaga/      01.jpg  …
  daylights/    01.jpg  …
```

- La **primera** foto (orden alfabético) es la **principal** (hero del detalle).
- El resto llena la **galería**.
- Nómbralas para que ordenen bien: `01.jpg`, `02.jpg`, … (cualquier formato vale).
- Si la subcarpeta está vacía, el detalle usa la foto suelta + bloques placeholder.

Las subcarpetas NO entran al mosaico de la portada (su glob no es recursivo), así que las
dos cosas quedan separadas y ordenadas.
