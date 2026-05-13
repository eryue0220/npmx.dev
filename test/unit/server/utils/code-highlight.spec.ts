import { describe, expect, it } from 'vitest'
import { linkifyModuleSpecifiers } from '#server/utils/code-highlight'

describe('linkifyModuleSpecifiers', () => {
  const dependencies = {
    'vue': { version: '3.4.0' },
    '@unocss/webpack': { version: '0.65.3' },
  }

  it('should linkify import ... from "package"', () => {
    // Shiki output for: import { ref } from "vue"
    const html =
      '<span class="line">' +
      '<span style="color:#F97583">import</span>' +
      '<span style="color:#E1E4E8"> { ref }</span>' +
      '<span style="color:#F97583">from</span>' +
      '<span style="color:#9ECBFF"> "vue"</span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, { dependencies })
    expect(result).toContain('<a href="/package-code/vue/v/3.4.0" class="import-link">')
  })

  it('should linkify export * from "package"', () => {
    // Shiki output for: export * from "@unocss/webpack"
    // Note: Shiki puts a leading space before "from" in the same span
    const html =
      '<span class="line">' +
      '<span style="color:#F97583">export</span>' +
      '<span style="color:#E1E4E8"> *</span>' +
      '<span style="color:#F97583"> from</span>' +
      '<span style="color:#9ECBFF"> "@unocss/webpack"</span>' +
      '<span style="color:#E1E4E8">;</span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, { dependencies })
    expect(result).toContain(
      '<a href="/package-code/@unocss/webpack/v/0.65.3" class="import-link">',
    )
  })

  it('prefers file-aware resolver for self package subpath imports', () => {
    const html =
      '<span class="line">' +
      '<span style="color:#F97583">import</span>' +
      '<span style="color:#E1E4E8"> * as walk </span>' +
      '<span style="color:#F97583">from</span>' +
      '<span style="color:#9ECBFF"> "empathic/walk"</span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, {
      dependencies,
      resolveRelative: specifier =>
        specifier.includes('empathic/walk') ? '/package-code/empathic/v/2.0.0/walk.mjs' : null,
    })

    expect(result).toContain(
      '<a href="/package-code/empathic/v/2.0.0/walk.mjs" class="import-link">"empathic/walk"</a>',
    )
  })

  it('linkifies when spacing around "from" varies across tokens', () => {
    const html =
      '<span class="line">' +
      '<span style="color:#F97583">import</span>' +
      '<span style="color:#E1E4E8"> * as walk </span>' +
      '<span style="color:#F97583">from </span>' +
      '<span style="color:#9ECBFF">"empathic/walk"</span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, {
      resolveRelative: specifier =>
        specifier.includes('empathic/walk') ? '/package-code/empathic/v/2.0.0/walk.mjs' : null,
    })

    expect(result).toContain(
      '<a href="/package-code/empathic/v/2.0.0/walk.mjs" class="import-link">"empathic/walk"</a>',
    )
  })

  it('falls back to dependency links when the file-aware resolver cannot resolve a specifier', () => {
    const html =
      '<span class="line">' +
      '<span style="color:#F97583">import</span>' +
      '<span style="color:#9ECBFF"> "vue"</span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, {
      dependencies,
      resolveRelative: () => null,
    })

    expect(result).toContain('<a href="/package-code/vue/v/3.4.0" class="import-link">"vue"</a>')
  })

  it('linkifies side-effect imports even when import token spacing varies', () => {
    const html =
      '<span class="line">' +
      '<span style="color:#F97583"> import </span>' +
      '<span style="color:#9ECBFF"> "@unocss/webpack" </span>' +
      '</span>'

    const result = linkifyModuleSpecifiers(html, { dependencies })

    expect(result).toContain(
      '<a href="/package-code/@unocss/webpack/v/0.65.3" class="import-link">"@unocss/webpack"</a>',
    )
  })
})
