// Single source of truth for a project's JSON-LD graph node — imported by both
// src/App.jsx (live SPA route effect) and scripts/generate-project-static.mjs
// (static prerender). Two independent copies of this logic drifted apart
// before (different @type, missing applicationCategory/operatingSystem on one
// side, missing codeRepository on the other) — see CLAUDE.md's note on
// keywords/alt needing hand-sync for the same underlying risk.

// schema.org has no clean "hardware project" type — map by tag signal instead
// of forcing everything into SoftwareApplication.
export function schemaType(project) {
  const tags = project.tags ?? []
  if (tags.includes('AI Research')) return 'ScholarlyArticle'
  if (tags.includes('Hardware') || tags.includes('IoT') || tags.includes('Electronics')) return 'CreativeWork'
  return 'SoftwareApplication'
}

export function projectJsonLdNode(project, { baseUrl, baseName, url }) {
  const type = schemaType(project)
  return {
    '@type': type,
    '@id': url,
    name: project.name,
    description: project.desc,
    url,
    author: { '@type': 'Person', '@id': `${baseUrl}/#person`, name: baseName, url: baseUrl },
    keywords: project.keywords ?? project.tags ?? [],
    ...(type === 'SoftwareApplication' ? { applicationCategory: 'WebApplication', operatingSystem: 'Any' } : {}),
    ...(project.github ? { codeRepository: project.github } : {}),
  }
}
