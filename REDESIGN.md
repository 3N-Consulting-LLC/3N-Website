# 3N website redesign

The redesign lives in `site/`. Netlify publishes the generated `dist/` directory.
The original site files at the repository root are outside that publish directory.
The redesign uses root-relative paths and can run on a Netlify preview or on the
3N production domain. It has no dependency on another website for its own assets.

## Build and review

Use Node 22. Run `npm ci`, `npm run build`, and `npm test`. Serve the
`dist/` directory at the web root for local review. Netlify applies the redirect
and security files in that directory. Preview pages retain their noindex tags.

## Sanity

The build reads published `whitePaper` documents from the existing 3N production
dataset. Sanity supplies the title, date, summary, content, cover, and PDF for
each paper. No API token is required for the published dataset. Keep credentials
and unpublished material out of the repository.

For automatic publishing, create a Netlify build hook for the production
branch. In Sanity, create a webhook for the production dataset pointing to that
hook. Select create, update, and delete, leave drafts excluded, and use a filter
that matches the affected paper on either side of a change:

```groq
coalesce(after()._type, before()._type) == "whitePaper"
```

Set this up after the production branch runs the redesign build. Until the hook
is configured, a new Netlify build is needed after a paper changes. Confirm
that the hook triggers a deploy and that the paper appears in the homepage,
Thought Leadership, and navigation.

## Launch checks

- Check the Netlify Deploy Preview and its build log. Verify both current papers,
  their PDFs, and the old `/white-paper.html?slug=...` links.
- Confirm open positions render and the talent-pool form loads on Careers. Use
  an approved test application and have 3N verify receipt in Zoho Recruit.
- The contact page uses 3N's existing Formspree endpoint. Confirm the preview
  domain is allowed if domain restrictions are enabled. Use an approved test
  inquiry and have the recipient confirm delivery. A future provider change
  needs its own delivery test.
- Publish using the existing Netlify site after approval. Check the domain and
  HTTPS on the resulting deployment. Reusing the existing Netlify site should
  allow the GoDaddy DNS records to stay as they are.
